const express = require('express');
const app = express();
  
app.get('/', (req, res) => {
  res.json({
    number: 1
  });
});

require('./auth')(app)

app.get('/array', (req, res) => {
  res.json([{
      number: 1,
      name: 'John',
      gender: 'male'
    },
    {
      number: 2,
      name: 'Ashley',
      gender: 'female'
    }
  ]);
});
  
// Setting the server to listen at port 3000
app.listen(8000, (req, res) => {
  console.log("Server is running at port 8000");
});