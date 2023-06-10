const express = require('express');
const app = express();
const sql = require('mssql');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

app.use(bodyParser.json());
app.use(cors())
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
          return res.json({ message: 'User exists' });
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
                          return res.json({ message: 'done' });

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
      return res.json({ message: 'agent' });
    } else if (usernametxt.toLowerCase() === 'admin') {
      req.session.id = usernametxt;
      return res.json({ message: 'admin' });
    } else {
      try {
        const pool = await sql.connect(dbConfig);
        const query = `SELECT username, Password FROM user_details WHERE username = '${usernametxt}' AND password = '${passtxt}'`;
        const result = await pool.request().query(query);
        sql.close();
  
        if (result.recordset.length > 0) {
          req.session.id = usernametxt;
          return res.json({ message: 'done' });
          // return res.send('done');
        } else {
          return res.status(401).json({ error: 'Data does not match' });
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Database error' });
      }
    }
  });

  //sign out
app.post('/sign-out', async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});


  
//Profile 
app.get('/profile', async (req, res) => {
  if (!req.session.id) {
    return res.redirect('/login');
  } else {
    try {
      const nametxt = `SELECT name FROM user_details WHERE username='${req.session.id}'`;
      const addtxt = `SELECT address_details.home_address FROM address_details INNER JOIN user_details ON address_details.address_id=user_details.address_id WHERE user_details.username='${req.session.id}'`;
      const nomtxt = `SELECT Nominee_Detail.nominee_name FROM Nominee_Detail INNER JOIN user_details ON Nominee_Detail.nominee_id=user_details.nominee_id WHERE user_details.username='${req.session.id}'`;
      const phonetxt = `SELECT phone_no FROM user_details WHERE username='${req.session.id}'`;
      const _password = `SELECT password FROM user_details WHERE username='${req.session.id}'`;
      const city_name = `SELECT address_details.city FROM address_details INNER JOIN user_details ON address_details.address_id=user_details.address_id WHERE user_details.username='${req.session.id}'`;

      const connection = await sql.connect(dbConfig);
      const [nameResult, addressResult, nomineeResult, phoneResult, passwordResult, cityResult] = await Promise.all([
        connection.query(nametxt),
        connection.query(addtxt),
        connection.query(nomtxt),
        connection.query(phonetxt),
        connection.query(_password),
        connection.query(city_name),
      ]);
      sql.close();

      const name = nameResult.recordset[0]?.name || '';
      const address = addressResult.recordset[0]?.home_address || '';
      const nominee = nomineeResult.recordset[0]?.nominee_name || '';
      const phone = phoneResult.recordset[0]?.phone_no || '';
      const password = passwordResult.recordset[0]?.password || '';
      const city = cityResult.recordset[0]?.city || '';

      return res.json({ name, address, nominee, phone, password, city });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: 'Database error' });
    }
  }
});

//Update Phone
app.put('/update-phone', (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const updateQuery = `UPDATE user_details SET phone_no = '${phone}' WHERE username = '${req.session.id}'`;

  sql.connect(dbConfig)
    .then((pool) => pool.request().query(updateQuery))
    .then(() => {
      sql.close();
      return res.send('Phone number updated successfully');
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: 'Database error' });
    });
});

//Update Name
app.put('/update-name', async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const updateQuery = `UPDATE user_details SET name = '${name}' WHERE username = '${req.session.id}'`;
    await pool.request().query(updateQuery);

    sql.close();

    return res.send('Name updated successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Update Password
app.put('/update-password', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const updateQuery = `UPDATE user_details SET password = '${password}' WHERE username = '${req.session.id}'`;
    await pool.request().query(updateQuery);

    sql.close();

    return res.send('Password updated successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Update City
app.put('/update-city', async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const getUserIdQuery = `SELECT address_id FROM user_details WHERE username = '${req.session.id}'`;
    const result = await pool.request().query(getUserIdQuery);
    const addressId = result.recordset[0].address_id;

    const updateQuery = `UPDATE address_details SET city = '${city}' WHERE address_id = ${addressId}`;
    await pool.request().query(updateQuery);

    sql.close();

    return res.send('City updated successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Update Address
app.put('/update-address', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const getUserIdQuery = `SELECT address_id FROM user_details WHERE username = '${req.session.id}'`;
    const result = await pool.request().query(getUserIdQuery);
    const addressId = result.recordset[0].address_id;

    const updateQuery = `UPDATE address_details SET home_address = '${address}' WHERE address_id = ${addressId}`;
    await pool.request().query(updateQuery);

    sql.close();

    return res.send('Address updated successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Update Nominee
app.put('/update-address', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const getUserIdQuery = `SELECT address_id FROM user_details WHERE username = '${req.session.id}'`;
    const result = await pool.request().query(getUserIdQuery);
    const addressId = result.recordset[0].address_id;

    const updateQuery = `UPDATE address_details SET home_address = '${address}' WHERE address_id = ${addressId}`;
    await pool.request().query(updateQuery);

    sql.close();

    return res.send('Address updated successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Premium page
app.get('/premium-profile', async (req, res) => {
  try {
    if (!req.session.id) {
      return res.redirect('Login.aspx');
    }

    const uidQuery = `SELECT user_id FROM user_details WHERE username = '${req.session.id}'`;
    const polNameQuery = `SELECT ref_policy_types.policy_type_name FROM user_details INNER JOIN user_policies ON user_details.user_id = user_policies.user_id INNER JOIN ref_policy_types ON ref_policy_types.policy_type_code = user_policies.policy_type_id WHERE user_details.username = '${req.session.id}'`;
    const preAmountQuery = `SELECT premium_amount FROM user_details WHERE username = '${req.session.id}'`;
    const sumQuery = `SELECT Sum_Assured FROM user_details WHERE username = '${req.session.id}'`;
    const statQuery = `SELECT user_policies.policy_status FROM user_policies INNER JOIN user_details ON user_details.user_id = user_policies.user_id WHERE user_details.username = '${req.session.id}'`;
    const paymentsQuery = `SELECT SUM(policy_payments.amount) FROM policy_payments INNER JOIN user_details ON policy_payments.user_id = user_details.user_id WHERE policy_payments.user_id = (SELECT user_id FROM user_details WHERE username = '${req.session.id}')`;

    const pool = await sql.connect(dbConfig);

    const uidResult = await pool.request().query(uidQuery);
    const uid = uidResult.recordset[0].user_id;

    const polNameResult = await pool.request().query(polNameQuery);
    const policy_name = polNameResult.recordset[0].policy_type_name;

    const preAmountResult = await pool.request().query(preAmountQuery);
    const premium_amount = preAmountResult.recordset[0].premium_amount || '';

    const sumResult = await pool.request().query(sumQuery);
    const sum_assured_amount = sumResult.recordset[0].Sum_Assured || '';

    const statResult = await pool.request().query(statQuery);
    const pstatus = statResult.recordset[0].policy_status;

    let payments = '';
    const paymentsResult = await pool.request().query(paymentsQuery);
    payments = paymentsResult.recordset[0][''] || '0';

    if (premium_amount === '') {
      return res.render('Wait for policy Approval');
    }

    const checkUidQuery = `SELECT user_id FROM Claim_Detials WHERE user_id = ${uid}`;
    const checkUidResult = await pool.request().query(checkUidQuery);
    const check_uid = checkUidResult.recordset[0].user_id || 0;

    const renderData = {
      policy_name,
      premium_amount,
      sum_assured_amount,
      payments,
      pstatus,
      showButton1: true,
      showButton2: false,
      showLabel3: false,
    };

    if (sum_assured_amount === payments) {
      renderData.showButton1 = false;

      if (check_uid === uid) {
        renderData.showLabel3 = true;
        renderData.showButton2 = false;
      } else {
        renderData.showLabel3 = false;
        renderData.showButton2 = true;
      }
    }

    sql.close();
    return res.render('Profile.aspx', renderData);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Paying premium
app.put('/process-payment', async (req, res) => {
  try {
    const getUserIdQuery = `SELECT user_id, premium_amount FROM user_details WHERE username = '${req.session.id}'`;

    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(getUserIdQuery);
    const { user_id, premium_amount } = result.recordset[0];

    let policy_no;

    for (let i = 1; i <= 3; i++) {
      if (i === 2) {
        const getPolicyNoQuery = `SELECT policy_no FROM user_policies WHERE user_id = ${user_id}`;
        const policyResult = await pool.request().query(getPolicyNoQuery);
        policy_no = policyResult.recordset[0].policy_no;
      }
      if (i === 3) {
        const paymentQuery = `EXEC Payments ${user_id}, ${policy_no}, ${premium_amount}`;
        await pool.request().query(paymentQuery);
      }
    }

    sql.close();

    return res.redirect('Policy Detail.aspx');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

//Claiming policy
app.put('/claim-policy', async (req, res) => {
  try {
    const uidQuery = `SELECT user_id FROM user_details WHERE username = '${req.session.id}'`;
    const nomidQuery = `SELECT nominee_id FROM user_details WHERE username = '${req.session.id}'`;
    const sumAssuredQuery = `SELECT Sum_Assured FROM user_details WHERE username = '${req.session.id}'`;
    const payQuery = `SELECT SUM(policy_payments.amount) FROM policy_payments INNER JOIN user_details ON policy_payments.user_id = user_details.user_id WHERE policy_payments.user_id = (SELECT user_id FROM user_details WHERE username = '${req.session.id}')`;

    const pool = await sql.connect(dbConfig);

    const uidResult = await pool.request().query(uidQuery);
    const uid = uidResult.recordset[0].user_id;

    const nomidResult = await pool.request().query(nomidQuery);
    const nomid = nomidResult.recordset[0].nominee_id;

    const sumAssuredResult = await pool.request().query(sumAssuredQuery);
    const pre_amount = sumAssuredResult.recordset[0].Sum_Assured;

    const payResult = await pool.request().query(payQuery);
    const _pay = payResult.recordset[0][''];

    const claimQuery = `EXEC Claiming_Policy ${uid}, ${nomid}, '${req.session.id}', ${_pay}`;
    const updateQuery = `UPDATE user_policies SET policy_status = 'Claimed' WHERE user_id = ${uid}`;

    await pool.request().query(updateQuery);
    await pool.request().query(claimQuery);

    sql.close();
    return res.send('Policy claimed successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Inactive user policy status detail
app.get('/user-policy-status-details', async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query('EXEC User_Policy_Status_Details;');

    sql.close();

    const data = result.recordset;
    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

//Active User policy status
app.get('/active-users-policies-details', async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query('EXEC Active_Users_Policies_Details;');

    sql.close();

    const data = result.recordset;
    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

//Claimed user policy
app.get('/claimed-user-policies', async (req, res) => {
  try {
    await sql.connect(dbConfig);

    const result = await sql.query('EXEC Claimed_User_Policies;');

    sql.close();

    const data = result.recordset;
    return res.json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});


//Approve policy
app.put('/approve-policy', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const getUsernameQuery = `SELECT username FROM user_details WHERE username = '${username}'`;

    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(getUsernameQuery);
    const uname = result.recordset[0].username;

    if (uname === username) {
      const getUserIdQuery = `EXEC Fetching_UserId_For_Activation '${username}'`;
      const getPolicyNameQuery = `EXEC Fetching_PolicyName_For_Activation '${username}'`;

      const uidResult = await pool.request().query(getUserIdQuery);
      const uid = uidResult.recordset[0][''];

      const policyNameResult = await pool.request().query(getPolicyNameQuery);
      const policyName = policyNameResult.recordset[0][''];

      const costCalculationQuery = `EXEC CostCalculation '${policyName}', ${uid}`;
      await pool.request().query(costCalculationQuery);

      sql.close();
      return res.send('Policy approved successfully');
    } else {
      return res.status(404).json({ error: 'Username not found' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Database error' });
  }
});

//Check Details
app.post('/checkDetails', async (req, res) => {
  const usertxt = req.body.usertxt;

  try {
    console.log(usertxt);
    const pool = await sql.connect(dbConfig);
    const getData = `select user_id from user_details where username='${usertxt}'`;
    const resultUserId = await pool.request().query(getData);

    if (resultUserId.recordset[0]!==undefined) {
      console.log("User");
      const uid = resultUserId.recordset[0].user_id;
      let pol_name = `select ref_policy_types.policy_type_name from user_details inner join user_policies on user_details.user_id=user_policies.user_id inner join ref_policy_types on ref_policy_types.policy_type_code=user_policies.policy_type_id where user_details.username='${usertxt}'`;
      let pre_amount = `select premium_amount from user_details where username='${usertxt}'`;
      let sum = `select Sum_Assured from user_details where username='${usertxt}'`;
      let stat = `select user_policies.policy_status from user_policies inner join user_details on user_details.user_id=user_policies.user_id where user_details.username='${usertxt}'`;

      const res_pol_name = await pool.request().query(pol_name);
      const res_pre_amount = await pool.request().query(pre_amount);
      const res_sum = await pool.request().query(sum);
      const res_stat = await pool.request().query(stat);

      let res_pay = '';
      if (res_stat.recordset[0].policy_status === 'Inactive') {
        res_sum.recordset[0].Sum_Assured = 'Waiting for Policy Approval';
        res_pre_amount.recordset[0].premium_amount = 'Waiting for Policy Approval';
        res_pay = 'Waiting for Policy Approval';
      } else {
        const pay = `select sum(policy_payments.amount) as paid_amount from policy_payments inner join user_details on policy_payments.user_id=user_details.user_id where policy_payments.user_id=${uid}`;
        const res_pay_result = await pool.request().query(pay);
        if(res_pay==="")
        res_pay = "0";
      }

      
      const policyDetails = {
        'Policy Name': res_pol_name.recordset[0].policy_type_name,
        'Policy Status': res_stat.recordset[0].policy_status,
        'Premium Amount': res_pre_amount.recordset[0].premium_amount,
        'Sum Assured': res_sum.recordset[0].Sum_Assured,
        'Paid Amount': res_pay
      };

      return res.json(policyDetails);
    } else if (resultUserId.recordset[0]===undefined) {
      console.log('No user');
      return res.json({ message: 'No User exists' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Database error' });
  }
});






  

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
