
JavaScript Code
// script.js

let users = JSON.parse(localStorage.getItem('users')) || {};
let loggedInUser = null;

// Function to generate referral link and code
function generateReferralLink(username) {
    return `https://example.com/?ref=${username}`;
}

// Function to register user
function registerUser(username, password, referralCode) {
    if (users[username]) {
        alert('Username already exists!');
        return;
    }
    users[username] = {
        password: password,
        referrals: [],
        referralCode: username
    };
    if (referralCode && users[referralCode]) {
        users[referralCode].referrals.push(username);
    }
    localStorage.setItem('users', JSON.stringify(users));
    alert('User registered successfully!');
}

// Function to login user
function loginUser(username, password) {
    if (!users[username] || users[username].password !== password
