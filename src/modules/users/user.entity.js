const { EntitySchema } = require("typeorm");

// TypeORM model for the users table.
// In plain JS we use EntitySchema (decorators require TypeScript).
const User = new EntitySchema({
    name: "User",
    tableName: "users",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        username: {
            type: "varchar",
            length: 50,
        },
        email: {
            type: "varchar",
            length: 100,
        },
        phone: {
            type: "varchar",
            length: 50,
        },
        password: {
            type: "varchar"
        },
        role: {
            type: "varchar",
            default: "student"
        },
        is_deleted: {
            type: "boolean",
            default: false
        }
    },
    relations: {
        // One instructor (User) can own many courses.
        courses: {
            type: "one-to-many",
            target: "Course",
            inverseSide: "instructor"
        }
        
    }
});

module.exports = { User };
