"""
Train a CNN model for plant disease classification using transfer learning
"""
import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow warnings

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from pathlib import Path
import matplotlib.pyplot as plt
import json
from datetime import datetime

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 20
LEARNING_RATE = 0.0001

def load_dataset_paths():
    """Load dataset paths from config file"""
    config_path = Path(__file__).parent / 'dataset_config.txt'
    
    if not config_path.exists():
        print("❌ Dataset config not found. Please run 'python download_dataset.py' first.")
        return None
    
    config = {}
    with open(config_path, 'r') as f:
        for line in f:
            key, value = line.strip().split('=')
            config[key] = value
    
    return config

def create_data_generators(train_dir, valid_dir):
    """Create data generators with augmentation"""
    print("📊 Creating data generators...")
    
    # Training data augmentation
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    
    # Validation data (only rescaling)
    valid_datagen = ImageDataGenerator(rescale=1./255)
    
    train_generator = train_datagen.flow_from_directory(
        train_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=True
    )
    
    valid_generator = valid_datagen.flow_from_directory(
        valid_dir,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        shuffle=False
    )
    
    return train_generator, valid_generator

def build_model(num_classes):
    """Build transfer learning model with MobileNetV2"""
    print(f"🏗️  Building model for {num_classes} classes...")
    
    # Load pre-trained MobileNetV2
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Build model
    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=3, name='top_3_accuracy')]
    )
    
    return model

def train_model(model, train_gen, valid_gen):
    """Train the model with callbacks"""
    print("🚀 Starting training...")
    
    # Create models directory
    models_dir = Path(__file__).parent / 'models'
    models_dir.mkdir(exist_ok=True)
    
    # Callbacks
    callbacks = [
        keras.callbacks.ModelCheckpoint(
            filepath=str(models_dir / 'plant_disease_model_best.h5'),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        ),
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=3,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    # Train
    history = model.fit(
        train_gen,
        validation_data=valid_gen,
        epochs=EPOCHS,
        callbacks=callbacks,
        verbose=1
    )
    
    return history

def plot_training_history(history):
    """Plot and save training history"""
    print("📈 Plotting training history...")
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 5))
    
    # Accuracy plot
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Loss plot
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Val Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    
    # Save plot
    plot_path = Path(__file__).parent / 'models' / 'training_history.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    print(f"💾 Training plot saved to: {plot_path}")
    
    plt.close()

def save_class_mapping(train_gen):
    """Save class indices mapping"""
    models_dir = Path(__file__).parent / 'models'
    class_mapping_path = models_dir / 'class_mapping.json'
    
    # Get class indices
    class_indices = train_gen.class_indices
    # Reverse mapping (index -> class name)
    index_to_class = {v: k for k, v in class_indices.items()}
    
    with open(class_mapping_path, 'w') as f:
        json.dump(index_to_class, f, indent=2)
    
    print(f"💾 Class mapping saved to: {class_mapping_path}")
    return index_to_class

def main():
    print("=" * 70)
    print("  Plant Disease Classification Model Training")
    print("=" * 70)
    print()
    
    # Load dataset paths
    config = load_dataset_paths()
    if not config:
        return
    
    train_dir = config['TRAIN_DIR']
    valid_dir = config['VALID_DIR']
    num_classes = int(config['NUM_CLASSES'])
    
    print(f"📁 Training directory: {train_dir}")
    print(f"📁 Validation directory: {valid_dir}")
    print(f"🏷️  Number of classes: {num_classes}\n")
    
    # Create data generators
    train_gen, valid_gen = create_data_generators(train_dir, valid_dir)
    
    print(f"\n📊 Training samples: {train_gen.samples}")
    print(f"📊 Validation samples: {valid_gen.samples}\n")
    
    # Build model
    model = build_model(num_classes)
    
    print("\n📋 Model Summary:")
    model.summary()
    
    # Train model
    print("\n" + "=" * 70)
    history = train_model(model, train_gen, valid_gen)
    
    # Save final model
    models_dir = Path(__file__).parent / 'models'
    final_model_path = models_dir / 'plant_disease_model.h5'
    model.save(final_model_path)
    print(f"\n💾 Final model saved to: {final_model_path}")
    
    # Save class mapping
    class_mapping = save_class_mapping(train_gen)
    
    # Plot training history
    plot_training_history(history)
    
    # Print final metrics
    print("\n" + "=" * 70)
    print("  Training Complete!")
    print("=" * 70)
    print(f"  Final Training Accuracy:   {history.history['accuracy'][-1]:.4f}")
    print(f"  Final Validation Accuracy: {history.history['val_accuracy'][-1]:.4f}")
    print(f"  Final Training Loss:       {history.history['loss'][-1]:.4f}")
    print(f"  Final Validation Loss:     {history.history['val_loss'][-1]:.4f}")
    print("=" * 70)
    print("\n✅ Next step: Run 'uvicorn api:app --reload' to start the API server")

if __name__ == "__main__":
    main()
