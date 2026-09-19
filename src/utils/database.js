import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";

const database = createStorage({
  driver: fsDriver({
    base: "./db"
  })
});

export default database;
