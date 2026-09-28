import { createStorage } from "unstorage";
import s3Driver from "unstorage/drivers/s3";
import config from "../../config.json" with { type: "json" };

const database = createStorage({
  driver: s3Driver(config.databaseS3),
});

export default database;
