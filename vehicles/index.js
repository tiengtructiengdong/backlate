module.exports = app => {
  
  app.get('/vehicle', (req, res) => {
    const token = req.query.token

    res.json({
      number: 1,
      name: 'John',
      gender: 'male',
      page: page
    });
  });
}