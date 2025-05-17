import { DataTypes } from "sequelize";
import sequelize from "../../config/dbConfig.js";

const Instruction = sequelize.define(
    "Instruction",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        schema: "public",
        timestamps: true,
        underscored: true,
    }
);

export default Instruction;
