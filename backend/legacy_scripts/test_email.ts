import validate from 'deep-email-validator';

async function testEmail() {
    const email = 'chinnureddy1414@gmail.com';
    const res = await validate({
        email: email,
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateSMTP: true,
    });
    console.log(res);
}
testEmail();
