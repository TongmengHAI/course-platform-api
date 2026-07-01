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
        instructor: {
            type: "varchar",
            nullable: true
        }
    }
});

module.exports = { Course };
