module.exports = (app, pool) => {
  const asyncQuery = promisify(pool.query).bind(pool);

  app.get("/bstien/gia", async (req, res) => {
    const { passcode } = req.headers.id;

    // if (passcode != "95g4ugfif8-kdasjko832947fhcj3je8fj") {
    //   res.status(400).json({ message: "nope" });
    // }
    try {
      const query = "SELECT * FROM bstien";
      const response = await asyncQuery(query);

      const data = response.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ data });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });

  app.get("/bstien/", async (req, res) => {
    res.sendFile(__dirname + "/index.html");
  });

  app.post("/bstien/thongbaothutien", async (req, res) => {
    const { passcode } = req.headers.id;
    const { name, xutri, price } = req.body;

    // if (passcode != "95g4ugfif8-kdasjko832947fhcj3je8fj") {
    //   res.status(400).json({ message: "nope" });
    // }
    try {
      const query = `
        INSERT INTO bstien (name, xutri, price)
        VALUES ('${name}', '${xutri}', ${price})
      `;
      const response = await asyncQuery(query);

      const data = response.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ data });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });

  app.put("/bstien/ghino", async (req, res) => {
    const { passcode } = req.headers.id;
    const { id, paid } = req.body;

    // if (passcode != "95g4ugfif8-kdasjko832947fhcj3je8fj") {
    //   res.status(400).json({ message: "nope" });
    // }
    var query;
    var response;
    var data;
    try {
      query = `SELECT * FROM bstien WHERE id = ${id}`;
      response = await asyncQuery(query);
      data = JSON.parse(JSON.stringify(response[0]));

      const { price } = data;

      if (price == paid) {
        query = `
          DELETE FROM bstien WHERE id = ${id}
        `;
      } else {
        query = `
          UPDATE bstien 
          SET price = ${price - paid}
          WHERE id = ${id}
        `;
      }
      response = await asyncQuery(query);

      data = response.map((item) => JSON.parse(JSON.stringify(item)));
      res.json({ data });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  });
};
