import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const Password = sequelize.define(
    "Password",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    },
    {
        underscored: true,
        timestamps: true,
        schema: "public",
    }
);

export default Password;