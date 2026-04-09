import { DistrictData } from '../types';

// NOTE: This is a sample representation of the data for demonstration purposes.
// A real-world application would likely fetch this from a database or a comprehensive API.
export const karnatakaLocationData: DistrictData[] = [
  {
    name: 'Bengaluru (Bangalore) Urban',
    taluks: [
      {
        name: 'Bengaluru North',
        villages: [
          { name: 'Yelahanka' },
          { name: 'Hesaraghatta' },
          { name: 'Jakkur' },
        ],
      },
      {
        name: 'Bengaluru South',
        villages: [
          { name: 'Kengeri' },
          { name: 'Begur' },
          { name: 'Tavarekere' },
        ],
      },
      {
        name: 'Anekal',
        villages: [
            { name: 'Attibele' },
            { name: 'Sarjapura' },
            { name: 'Jigani' },
        ],
      },
    ],
  },
  {
    name: 'Belagavi (Belgaum)',
    taluks: [
      {
        name: 'Belagavi',
        villages: [
          { name: 'Uchagaon' },
          { name: 'Kakati' },
          { name: 'Sambra' },
        ],
      },
      {
        name: 'Gokak',
        villages: [
          { name: 'Konnur' },
          { name: 'Gokak Falls' },
          { name: 'Dhupdal' },
        ],
      },
      {
        name: 'Athani',
        villages: [
            { name: 'Ainapur' },
            { name: 'Kagwad' },
            { name: 'Shedbal' },
        ],
      },
    ],
  },
  {
    name: 'Mysuru (Mysore)',
    taluks: [
      {
        name: 'Mysuru',
        villages: [
          { name: 'Ilavala' },
          { name: 'Varuna' },
          { name: 'Jayapura' },
        ],
      },
      {
        name: 'Nanjangud',
        villages: [
          { name: 'Devarasanahalli' },
          { name: 'Hullahalli' },
          { name: 'Kawalande' },
        ],
      },
      {
        name: 'Hunsur',
        villages: [
            { name: 'Bilikere' },
            { name: 'Gavadagere' },
            { name: 'Hanagodu' },
        ],
      },
    ],
  },
  {
      name: 'Shivamogga (Shimoga)',
      taluks: [
          {
              name: 'Shivamogga',
              villages: [
                  { name: 'Gajanur' },
                  { name: 'Holehonnur' },
                  { name: 'Ayanur' },
              ]
          },
          {
              name: 'Bhadravati',
              villages: [
                  { name: 'Singanamane' },
                  { name: 'Kudligere' },
                  { name: 'Bandigudda' },
              ]
          },
          {
              name: 'Sagara',
              villages: [
                  { name: 'Talaguppa' },
                  { name: 'Keladi' },
                  { name: 'Varadahalli' },
              ]
          }
      ]
  }
];
