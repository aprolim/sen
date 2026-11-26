// Verifica slugs de la base local y cómo se generan
const mongoose = require('mongoose');
require('dotenv').config();
const Senador = require('./src/models/Senador');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const n = await Senador.countDocuments();
  console.log('senadores en local:', n);

  if (n > 0) {
    const m = await Senador.find({ name: /mentasti/i }, { id: 1, name: 1, slug: 1, _id: 0 }).lean();
    console.log('mentasti:', m);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
