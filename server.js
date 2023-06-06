const express = require('express');
const app = express();
const sql = require('mssql');
const bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Database configuration
const dbConfig = {
  user: 'Amjad',
  password: 'Amjad@123',
  server: 'mssql-130004-0.cloudclusters.net',
  port:19856,
  database: 'Insurance',
  options: {
    trustServerCertificate: true
  }
};

// API endpoints
app.get('/users', (req, res) => {
  sql.connect(dbConfig, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send('Database connection error');
    } else {
      const request = new sql.Request();
      request.query('select * from Users', (err, recordset) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error retrieving users from database');
        } else {
          res.send(recordset.recordset);
        }
      });
    }
  });
});

app.post('/users', (req, res) => {
    const { Id, Firstname, Lastname, Email, Username, Password } = req.body;
  
    sql.connect(dbConfig, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        return res.status(500).send('Database connection error');
      }
  
      const request = new sql.Request();
      const query = `
        INSERT INTO Users (Id, Firstname, Lastname, Email, Username, Password)
        VALUES (${Id}, '${Firstname}', '${Lastname}', '${Email}', '${Username}', '${Password}')
      `;
  
      request.query(query, (err) => {
        if (err) {
          console.error('Error inserting data:', err);
          return res.status(500).send('Error inserting data');
        }
  
        res.status(201).send('Data inserted successfully');
      });
    });
  });
  

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  sql.connect(dbConfig, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send('Database connection error');
    } else {
      const request = new sql.Request();
      request.query(`SELECT * FROM Users WHERE Id = ${userId}`, (err, recordset) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error retrieving user from database');
        } else if (recordset.recordset.length === 0) {
          res.status(404).send('User not found');
        } else {
          res.send(recordset.recordset[0]);
        }
      });
    }
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
