# BackupD

A simple backup http server to store backups on Amazon Cloud Drive without all the fuss of the API.

Note: Amazon states the service is for non commercial use. Use at your own risk to do more than store personal backups.

## Features

- HTTP
- FTP

## Requirements

- Node.js (4 or 5)
- Amazon Cloud Drive
- Amazon Developer Account (https://developer.amazon.com/public/apis/experience/cloud-drive/)
- Amazon Security Profile (https://developer.amazon.com/iba-sp/overview.html)

## Setup

- Clone the git repository, and run `npm install`
- Sign up for a developer account at the link above
- Create a security profile
- Whitelist the security profile (https://developer.amazon.com/cd/sp/overview.html), and edit the authorized urls
- Fill in the fields in config
- Get an SSL certificate (This isn't required, but is highly recommended as the data isn't encrypted before sending unless you do it yourself)
- Navigate to the url http(s)://your.server/authorize
- Authorize with Amazon
- Navigate to http(s)://your.server/sync (required to sync data)
- Optionally, disable HTTP and only use FTP

## Adding users

Users are just that, authenticated users. They can be HTTP, FTP, or both.

The following options are available for users:

- password - the user's authentication password
- root - root directory (chroot, also can be a specific directory for the day)
- aes - whether to encrypt the files uploaded with AES before uploading to Amazon

## Root directories

When specifying a root directory, you can use the replacements {username} and {moment|<format>}.

- {username} replaces the specified part with the user's username
- {moment|<format>} replaces the specified part with a formatted timestamp, depending on the format.

## FTP

The built-in ftp server proxies requests to Amazon Cloud Drive. It does not currently support downloading files, but might in the future.

Supported operations are as follows:

- Upload
- Listing files/directories
- Creating directories
- Deleting directories/files

## Contributing

Got a feature or better way to do something? Feel free to make a pull request. This is just a proof of concept mostly, and the ftp implementation leaves a lot to be desired.

To keep the code clean, we ask that you follow the following conventions:

- Use tabs, not spaces
- Follow the existing style, i.e. don't change the formatting half way through the file