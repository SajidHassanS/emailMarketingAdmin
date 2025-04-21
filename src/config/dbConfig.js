import { Sequelize } from "sequelize";
import chalk from "chalk";

// You can move these to a config file later
const dbName = "project3";
const dbUser = "postgres";
const dbPass = "hassan526688";
// const dbHost = "project3.c7q4kemc23tb.eu-north-1.rds.amazonaws.com";
const dbHost = "project3.c7q4kemc23tb.eu-north-1.rds.amazonaws.com";

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: 5432,
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: console.log, // Optional: shows SQL queries
});

export const connectDB = async () => {
  try {
    console.log(chalk.cyan("▶ Connecting to database with manual config..."));
    console.log("▶ Dialect Options:", sequelize.options.dialectOptions);

    await sequelize.authenticate();

    console.log(
      chalk.green.bold(`Connected to the database ${dbName} ${dbHost}`)
    );
    await sequelize.sync();
    console.log(chalk.green.bold("✅ Models synced successfully"));
  } catch (error) {
    console.error(chalk.red.bold("❌ Error connecting to database:"), error);
    process.exit(1);
  }
};

export default sequelize;
