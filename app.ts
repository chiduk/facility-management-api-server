import dotenv from 'dotenv';
import express from 'express';
import router from './routers/index';
import mongoose from 'mongoose';

dotenv.config({path : './configs/.env'});

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('')
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  });

app.use('/', router);
