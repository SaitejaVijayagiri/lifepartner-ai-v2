
export class PrismaClient {
    constructor() {
        console.log("MOCKED PrismaClient constructor called");
    }
    $connect() {
        console.log("MOCKED $connect called");
        return Promise.resolve();
    }
}
