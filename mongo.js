const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect('mongodb+srv://durgesh:XtWHwTo878ynqU7K@ecommerce.ylbcn.mongodb.net/?retryWrites=true&w=majority&appName=ecommerce');

const MyModel = mongoose.model('MyCollection', new mongoose.Schema({}, { strict: false }));

MyModel.find().lean().then(data => {
	fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
	console.log('Exported to backup.json');
});

