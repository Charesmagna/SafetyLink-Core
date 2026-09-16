const { createClient } = require("@libsql/client");
const db = createClient({ url: "file:test2.db" });
db.execute("CREATE TABLE test (id INTEGER, verified BOOLEAN)").then(() => {
  return db.execute("INSERT INTO test VALUES (1, true)");
}).then(() => {
  return db.execute("SELECT * FROM test WHERE verified = true");
}).then((res) => {
  console.log("Result:", res.rows);
}).catch(console.error);
