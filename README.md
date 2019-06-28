# Cursor-Pagination
Page token generator for javascript using Protobufjs

Example Usage:
```javascript
const { CursorPagination } = require('cursor-pagination');
const pagination = new CursorPagination();

// Returns a buffer
const tokenData = pagination.createToken({
  entries: [
    { key: 'updatedAt', value: new Date() },
    { key: 'id', value: 'abcdefg', asc: false }
  ]
});

// Convert to base64 string to return to user.
const token = tokenData.toString('base64');

// Convert token back into buffer and parse it
const parsedToken = pagination.parseToken(Buffer.from(token, 'base64'));
```


Pass in an AES cipher Key return an encrypted token
```javascript
const { CursorPagination } = require('cursor-pagination');
const pagination = new CursorPagination({
  aesKey: '0000000000000000'
});

// Encrypted with the cipher key passed in
const tokenData = pagination.createToken({
  entries: [
    { key: 'updatedAt', value: new Date() },
    { key: 'id', value: 'abcdefg', asc: false }
  ]
});
```