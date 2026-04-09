"""
Download and verify the Plant Disease Dataset from Kaggle
"""
import kagglehub
import os
from pathlib import Path

def download_dataset():
    """Download the New Plant Diseases Dataset from Kaggle"""
    print("🌱 Downloading Plant Disease Dataset...")
    print("This may take a few minutes depending on your internet connection.\n")
    
    try:
        # Download latest version
        path = kagglehub.dataset_download("vipoooool/new-plant-diseases-dataset")
        
        print(f"\n✅ Dataset downloaded successfully!")
        print(f"📁 Path to dataset files: {path}\n")
        
        # Verify dataset structure
        verify_dataset(path)
        
        return path
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        return None

def verify_dataset(dataset_path):
    """Verify the dataset structure and print statistics"""
    print("🔍 Verifying dataset structure...\n")
    
    dataset_path = Path(dataset_path)
    
    # Look for train/valid/test directories
    train_dir = None
    valid_dir = None
    test_dir = None
    
    # Search for the directories
    for root, dirs, files in os.walk(dataset_path):
        if 'train' in dirs:
            train_dir = Path(root) / 'train'
        if 'valid' in dirs:
            valid_dir = Path(root) / 'valid'
        if 'test' in dirs:
            test_dir = Path(root) / 'test'
    
    if not train_dir:
        print("⚠️  Warning: Could not find 'train' directory")
        print(f"Dataset contents: {list(dataset_path.iterdir())}")
        return
    
    # Count classes and images
    def count_images(directory):
        if not directory or not directory.exists():
            return 0, []
        classes = [d for d in directory.iterdir() if d.is_dir()]
        total_images = sum(len(list(c.glob('*.jpg')) + list(c.glob('*.png')) + list(c.glob('*.JPG'))) for c in classes)
        return total_images, [c.name for c in classes]
    
    train_count, train_classes = count_images(train_dir)
    valid_count, valid_classes = count_images(valid_dir)
    test_count, test_classes = count_images(test_dir)
    
    print("📊 Dataset Statistics:")
    print(f"  Training images:   {train_count:,}")
    print(f"  Validation images: {valid_count:,}")
    print(f"  Test images:       {test_count:,}")
    print(f"  Total classes:     {len(train_classes)}")
    print(f"\n📋 Disease Classes:")
    for i, cls in enumerate(sorted(train_classes), 1):
        print(f"  {i:2d}. {cls}")
    
    print(f"\n✅ Dataset verified successfully!")
    print(f"📁 Training directory: {train_dir}")
    
    # Save paths to a config file
    config_path = Path(__file__).parent / 'dataset_config.txt'
    with open(config_path, 'w') as f:
        f.write(f"DATASET_PATH={dataset_path}\n")
        f.write(f"TRAIN_DIR={train_dir}\n")
        f.write(f"VALID_DIR={valid_dir}\n")
        f.write(f"TEST_DIR={test_dir}\n")
        f.write(f"NUM_CLASSES={len(train_classes)}\n")
    
    print(f"💾 Dataset paths saved to: {config_path}")

if __name__ == "__main__":
    print("=" * 60)
    print("  Plant Disease Dataset Downloader")
    print("=" * 60)
    print()
    
    dataset_path = download_dataset()
    
    if dataset_path:
        print("\n" + "=" * 60)
        print("  Next Steps:")
        print("=" * 60)
        print("  1. Review the dataset structure above")
        print("  2. Run 'python train_model.py' to train the model")
        print("  3. Run 'uvicorn api:app --reload' to start the API server")
        print("=" * 60)
