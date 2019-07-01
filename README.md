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


Pass in an AES cipher Key to return an encrypted token
```javascript
const { CursorPagination } = require('cursor-pagination');

// Key should be a 16 character hex string
const pagination = new CursorPagination({
  aesKey: '2cc3b35dd381ff3a' // CHANGE ME
});

// Encrypted with the cipher key passed in
const tokenData = pagination.createToken({
  entries: [
    { key: 'updatedAt', value: new Date() },
    { key: 'id', value: 'abcdefg', asc: false }
  ]
});
```

### Notes

When working with SQL, the parsed token should be converted into a boolean logic statement.
A single column can easily be turned into the statement `WHERE id > @id`, however dealing with multiple columns becomes a little trickier.
Pagination based on multiple columns would look something like this:
```sql
WHERE (column1 > @value1)
    OR (column1 = @value1 AND column2 > @value2)
    OR (column1 = @value1 AND column2 = @value2 AND column3 > @value3)
```

The combination of these columns must be unique so it is a good idea to always make the last column of the token the primary key for the table.

### References
https://www.sitepoint.com/paginating-real-time-data-cursor-based-pagination/
https://stackoverflow.com/questions/38017054/mysql-cursor-based-pagination-with-multiple-columns