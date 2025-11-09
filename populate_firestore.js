// To execute this script, you must first install the Firebase Admin SDK by running:
// npm install firebase-admin
//
// After installation, run the script from your terminal using Node.js:
// node populate_firestore.js
//
// This script will populate the Firestore database with initial data for the Greenroof application.
// It sets up collections for shops, site settings (including announcements and policies), and admins.
//
// Before running, ensure you have your Firebase service account credentials.
// You can download the service account JSON file from your Firebase project settings.
// Once you have the file, you can set the GOOGLE_APPLICATION_CREDENTIALS environment variable,
// or you can update the serviceAccount variable in the script with the path to your key file.

const admin = require('firebase-admin');

// --- Firebase Service Account Configuration ---
// The service account key is essential for authenticating with your Firebase project.
// There are two recommended ways to provide these credentials:
//
// 1. (Recommended) Set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
//    This is the most secure method, as it keeps your credentials out of the source code.
//    In your terminal, run:
//    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"
//
// 2. Alternatively, you can hardcode the path to your service account key file here.
//    However, this is not recommended for production environments.
//    const serviceAccount = require('/path/to/your/serviceAccountKey.json');

// --- Firebase Database URL ---
// The databaseURL tells the Admin SDK which Firestore database to connect to.
// You can find this URL in your Firebase project settings, typically in the format:
// https://<YOUR_PROJECT_ID>.firebaseio.com or https://<YOUR_PROJECT_ID>.
const databaseURL = 'https://greenroof-8951b.firebaseio.com';

try {
  // --- Initialize Firebase Admin SDK ---
  // The SDK will automatically detect the GOOGLE_APPLICATION_CREDENTIALS environment variable if it's set.
  // If you are using the hardcoded path, you will need to modify the initialization like this:
  // admin.initializeApp({
  //   credential: admin.credential.cert(serviceAccount),
  //   databaseURL: databaseURL
  // });
  admin.initializeApp({
    databaseURL: databaseURL
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK. Please ensure your service account credentials are set correctly.', error);
  process.exit(1);
}

const db = admin.firestore();

// --- Data Definitions ---
// The following constants define the initial data that will be populated into the Firestore database.
// This data includes shop listings, site-wide settings like announcements and policies, and a list of admin users.
//
// - `shopsData`: An array of shop objects, each with multilingual information.
// - `siteSettingsData`: Contains documents for site-wide settings, such as announcements and policies.
// - `adminsData`: A map of admin user UIDs to their roles. This is used for access control.
const shopsData = [
    {
        "id": "shop001",
        "name_zh-TW": "綠色廚房",
        "name_en": "Green Kitchen",
        "type_zh-TW": "素食餐廳",
        "type_en": "Vegetarian Restaurant",
        "address_zh-TW": "台北市信義區市府路45號",
        "address_en": "No. 45, City Hall Rd, Xinyi District, Taipei City",
        "phone": "02-1234-5678",
        "website": "www.greenkitchen.com",
        "lat": 25.033964,
        "lng": 121.564468,
        "description_zh-TW": "提供有機、本地食材的創意素食料理。",
        "longDescription_zh-TW": "綠色廚房是一家致力於推廣永續飲食的素食餐廳。我們與小農合作，選用當季最新鮮的有機食材，烹調出美味與健康兼具的創意料理。希望透過美食，讓更多人認識並喜愛蔬食。",
        "description_en": "Creative vegetarian dishes using organic and local ingredients.",
        "longDescription_en": "Green Kitchen is a vegetarian restaurant dedicated to promoting sustainable dining. We partner with small farmers to select the freshest seasonal organic ingredients, creating innovative dishes that are both delicious and healthy. We hope that through our food, more people will come to know and love vegetable-based cuisine.",
        "tags": ["organic", "local-fare"]
    },
    {
        "id": "shop002",
        "name_zh-TW": "環保雜貨店",
        "name_en": "Eco General Store",
        "type_zh-TW": "無包裝商店",
        "type_en": "Package-Free Store",
        "address_zh-TW": "新北市板橋區文化路一段100號",
        "address_en": "No. 100, Section 1, Wenhua Road, Banqiao District, New Taipei City",
        "phone": "02-8765-4321",
        "website": "www.ecostore.com",
        "lat": 25.0139,
        "lng": 121.4638,
        "description_zh-TW": "販售各種無包裝食品、清潔用品及生活雜貨。",
        "longDescription_zh-TW": "環保雜貨店提倡裸賣精神，鼓勵消費者自備容器購物，減少一次性塑膠浪費。店內提供各式各樣的穀物、豆類、油品、清潔劑，以及竹牙刷、蜂蠟布等環保生活用品，讓我們一起從日常小事開始，實踐零廢棄生活。",
        "description_en": "Sells a variety of package-free foods, cleaning supplies, and daily goods.",
        "longDescription_en": "The Eco General Store promotes the spirit of unpackaged shopping, encouraging consumers to bring their own containers to reduce single-use plastic waste. The store offers a wide variety of grains, beans, oils, detergents, as well as eco-friendly daily items like bamboo toothbrushes and beeswax wraps. Let's start with small daily actions to practice a zero-waste lifestyle.",
        "tags": ["zero-waste", "bulk-buy"]
    }
];

const siteSettingsData = {
    'announcements': {
        "content": "歡迎來到我們的永續商店地圖！"
    },
    'policies': {
        "privacy": "我們非常重視您的隱私權...",
        "disclaimer": "本網站資訊僅供參考..."
    }
};

const adminsData = {
    // To find your UID, authenticate in the web app and check the browser console for your user object.
    'your_admin_user_uid_here': { role: 'superadmin' }
};

// --- Firestore Population Logic ---
// The following functions handle the process of writing the data defined above to Firestore.
//
// - `populateCollection(collectionName, data)`: A generic function to populate a collection.
//   It takes the collection name and an array of documents to add.
//
// - `populateSiteSettings()`: A specific function to populate the `site_settings` collection.
//   It iterates through the `siteSettingsData` object and sets each document.
//
// - `populateAdmins()`: A specific function to populate the `admins` collection.
//
// - `main()`: The main function that orchestrates the entire population process.
const populateCollection = async (collectionName, data) => {
    console.log(`Populating ${collectionName}...`);
    const collectionRef = db.collection(collectionName);
    const batch = db.batch();

    data.forEach(item => {
        const docRef = collectionRef.doc(item.id);
        batch.set(docRef, item);
    });

    await batch.commit();
    console.log(`${collectionName} collection populated with ${data.length} documents.`);
};

const populateSiteSettings = async () => {
    console.log('Populating site_settings...');
    const settingsRef = db.collection('site_settings');
    const batch = db.batch();

    for (const [docId, data] of Object.entries(siteSettingsData)) {
        const docRef = settingsRef.doc(docId);
        batch.set(docRef, data);
    }

    await batch.commit();
    console.log('site_settings collection populated.');
};

const populateAdmins = async () => {
    console.log('Populating admins...');
    const adminsRef = db.collection('admins');
    const batch = db.batch();

    for (const [uid, data] of Object.entries(adminsData)) {
        const docRef = adminsRef.doc(uid);
        batch.set(docRef, data);
    }

    await batch.commit();
    console.log('admins collection populated.');
};

const main = async () => {
    try {
        await populateCollection('shops', shopsData);
        await populateSiteSettings();
        await populateAdmins();
        console.log('\nDatabase population complete!');
    } catch (error) {
        console.error('Error populating database:', error);
    }
};

main();