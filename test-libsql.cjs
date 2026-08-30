const { createClient } = require("@libsql/client");
const db = createClient({ url: "file:test.db" });
db.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)").then(() => {
  return db.execute({ sql: "INSERT INTO test (name) VALUES (?)", args: ["hello"] });
}).then((res) => {
  console.log("Insert result:", res);
  return db.execute("SELECT * FROM test");
}).then((res) => {
  console.log("Select result:", res);
  console.log("rowCount:", res.rows.length);
}).catch(console.error);
