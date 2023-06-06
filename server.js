const express = require('express');
const app = express();
const sql = require('mssql');
const bodyParser = require('body-parser');
const session = require('express-session');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: '5azx', // Replace with your own secret key
    resave: false,
    saveUninitialized: false,
  })
);

// Database configuration
// const dbConfig = {
//   user: 'Amjad',
//   password: 'Amjad@123',
//   server: 'mssql-130004-0.cloudclusters.net',
//   port:19856,
//   database: 'Insurance',
//   options: {
//     trustServerCertificate: true
//   }
// };

const dbConfig = {
    user: 'sa',
    password: 'amjad',
    server: 'DESKTOP-27TFO05',
    database: 'Insurance',
    options: {
      trustServerCertificate: true
    }
  };

// For Practice only
app.get('/users', (req, res) => {
  sql.connect(dbConfig, (err) => {
    if (err) {
      console.log(err);
      res.status(500).send('Database connection error');
    } else {
      const request = new sql.Request();
      request.query('select * from user_details', (err, recordset) => {
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


//Project Post
app.post('/signup', (req, res) => {
    const { nametxt, usernametxt, passtxt, phonetxt, dtext, citytxt, addresstxt, nomineetxt,selected_policy } = req.body;
  
    // Data validation
    if (!nametxt || !usernametxt || !passtxt || !phonetxt || !dtext || !citytxt || !addresstxt || !nomineetxt||!selected_policy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    // Connect to the database
    const con = new sql.ConnectionPool(dbConfig);
    con.connect(err => {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: 'Database connection error' });
      }
  
      // Perform data validation
      con.query(`SELECT username FROM user_details WHERE username = '${usernametxt}'`, (err, result) => {
        if (err) {
          console.log(err);
          con.close();
          return res.status(500).json({ error: 'Error checking existing username' });
        }
        console.log(result.recordset[0]==undefined)
        // console.log(usernametxt==result.recordset[0].username)
        // console.log(result.recordset[0].username);
        if (result.recordset[0]!=undefined) {
          con.close();
          console.log("User exists")
          return res.send("User exists")
        }
  
        // Execute SQL queries
        con.query(`INSERT INTO user_details (name, username, password, phone_no, dob) VALUES ('${nametxt}', '${usernametxt}', '${passtxt}', '${phonetxt}', '${dtext}')`, (err, result) => {
          if (err) {
            console.log(err);
            con.close();
            return res.status(500).json({ error: 'Error inserting user details' });
          }
  
          con.query(`INSERT INTO address_details (home_address, city) VALUES ('${addresstxt}', '${citytxt}')`, (err, result) => {
            if (err) {
              console.log(err);
              con.close();
              return res.status(500).json({ error: 'Error inserting address details' });
            }
  
            con.query(`INSERT INTO Nominee_Detail (nominee_name) VALUES ('${nomineetxt}')`, (err, result) => {
              if (err) {
                console.log(err);
                con.close();
                return res.status(500).json({ error: 'Error inserting nominee details' });
              }
  
              con.query('SELECT MAX(nominee_id) AS max_nominee_id FROM Nominee_Detail', (err, result) => {
                if (err) {
                  console.log(err);
                  con.close();
                  return res.status(500).json({ error: 'Error retrieving max nominee ID' });
                }
                console.log(result)
                const nomid = result.recordset[0].max_nominee_id
                console.log(nomid)
  
                con.query('SELECT MAX(address_id) AS max_address_id FROM address_details', (err, result) => {
                  if (err) {
                    console.log(err);
                    con.close();
                    return res.status(500).json({ error: 'Error retrieving max address ID' });
                  }
  
                  const addit = result.recordset[0].max_address_id;
  
                  con.query('SELECT MAX(user_id) AS max_user_id FROM user_details', (err, result) => {
                    if (err) {
                      console.log(err);
                      con.close();
                      return res.status(500).json({ error: 'Error retrieving max user ID' });
                    }
  
                    const uid = result.recordset[0].max_user_id;
  
                    const addingIdsQuery = `Update user_details set nominee_id=${nomid},address_id=${addit} where  user_id=${uid}`
                    con.query(addingIdsQuery, (err, result) => {
                      if (err) {
                        console.log(err);
                        con.close();
                        return res.status(500).json({ error: 'Error inserting IDs into user_details' });
                      }
  
                      const dt = new Date().toISOString().split('T')[0];
                      const policyTypeQuery = `SELECT policy_type_code FROM ref_policy_types WHERE policy_type_name = '${selected_policy}'`;
                      con.query(policyTypeQuery, (err, result) => {
                        if (err) {
                          console.log(err);
                          con.close();
                          return res.status(500).json({ error: 'Error retrieving policy type code' });
                        }
  
                        const policyCode = result.recordset[0].policy_type_code;
                        const userPolicyQuery = `INSERT INTO user_policies (user_id, nominee_id, date_registered, policy_type_id, policy_status) VALUES (${uid}, ${nomid}, '${dt}', '${policyCode}', 'Inactive')`;
                        con.query(userPolicyQuery, (err, result) => {
                          if (err) {
                            console.log(err);
                            con.close();
                            return res.status(500).json({ error: 'Error inserting user policy details' });
                          }
  
                          // Close the database connection
                          con.close();
  
                          // Redirect the user or send a response
                          return res.send('done');
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  //sign in 
  app.post('/signin', async (req, res) => {
    const { usernametxt, passtxt } = req.body;
  
    if (usernametxt === '' || passtxt === '') {
      let errors = [];
      if (usernametxt === '') {
        errors.push({ field: 'username', message: 'Username is required' });
      }
      if (passtxt === '') {
        errors.push({ field: 'password', message: 'Password is required' });
      }
      return res.status(400).json({ errors });
    }
  
    if (usernametxt.toLowerCase() === 'agent') {
      req.session.id = usernametxt;
      return res.send('done');
    } else if (usernametxt.toLowerCase() === 'admin') {
      req.session.id = usernametxt;
      return res.send('Done');
    } else {
      try {
        const pool = await sql.connect(dbConfig);
        const query = `SELECT username, Password FROM user_details WHERE username = '${usernametxt}' AND password = '${passtxt}'`;
        const result = await pool.request().query(query);
        sql.close();
  
        if (result.recordset.length > 0) {
          req.session.id = usernametxt;
          return res.send('done');
        } else {
          return res.status(401).json({ error: 'Data does not match' });
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Database error' });
      }
    }
  });
  
  

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
