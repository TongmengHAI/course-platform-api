const { EntitySchema } = require("typeorm");

// TypeORM model for the courses table.
const Course = new EntitySchema({
    name: "Course",
    tableName: "courses",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true
        },
        title: {
            type: "varchar"
        },
        description: {
            type: "text",
            nullable: true
        },
        category: {
            type: "varchar",
            nullable: true
        },
        level: {
            type: "varchar",
            nullable: true
        },
        price: {
            type: "int",
            default: 0
        },
        is_deleted: {
            type: "boolean",
            default: false
        }
    },
    relations: {
        // Each course belongs to one instructor (a User).
        instructor: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "instructorId" },
            nullable: true,
            onDelete: "SET NULL",
            // onUpdate: "CASCADE"
        }
    }
});

module.exports = { Course };
