const { EntitySchema } = require("typeorm");

const RefreshToken = new EntitySchema({
    name: "RefreshToken",
    tableName: "refresh_tokens",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        token: {
            type: "varchar",
            length: 255,
            unique: true
        },
        expiresAt: {
            type: "datetime"
        },
        createdAt: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP"
        }
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "userId" },
            onDelete: "CASCADE"  
            
        }
    }
});

module.exports = { RefreshToken };