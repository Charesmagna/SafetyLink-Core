const { createClient } = require("@libsql/client");
const db = createClient({ url: "file:test.db" });
db.execute({ sql: "INSERT INTO test (name) VALUES (?) RETURNING id", args: ["world"] })
.then((res) => {
  console.log("Returning result:", res.rows);
}).catch(console.error);
