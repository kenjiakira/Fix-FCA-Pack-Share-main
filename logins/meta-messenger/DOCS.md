# API Documentation

> [!TIP]
> This library is written in the style of Schmavery/facebook-chat-api (without using source code) for familiarity and ease of use (and without callbacks).

> [!IMPORTANT]
> **BigInt for Large Numbers**: This library uses JavaScript `BigInt` for large numeric values like `threadId`, `userId`, `senderId`, etc. This prevents integer overflow since Facebook IDs can exceed JavaScript's `Number.MAX_SAFE_INTEGER` (2^53-1). When comparing or using these values, use `BigInt` literals (e.g., `123n`) or `BigInt()` conversion.

* [Cookie Security](#cookie-security)
* [Client](#client)
  * [`new Client(cookies, options)`](#constructor)
  * [`client.connect()`](#connect)
  * [`client.disconnect()`](#disconnect)
  * [`client.isFullyReady()`](#isfullyready)
  * [Properties](#properties)
* [Regular Messages](#regular-messages)
  * [`client.sendMessage()`](#sendMessage)
  * [`client.sendReaction()`](#sendReaction)
  * [`client.editMessage()`](#editMessage)
  * [`client.unsendMessage()`](#unsendMessage)
  * [`client.sendTypingIndicator()`](#sendTypingIndicator)
  * [`client.markAsRead()`](#markAsRead)
* [Media](#media)
  * [`client.sendImage()`](#sendImage)
  * [`client.sendVideo()`](#sendVideo)
  * [`client.sendVoice()`](#sendVoice)
  * [`client.sendFile()`](#sendFile)
  * [`client.sendSticker()`](#sendSticker)
  * [`client.uploadMedia()`](#uploadMedia)
* [Thread/Group Management](#threadgroup-management)
  * [`client.createThread()`](#createThread)
  * [`client.renameThread()`](#renameThread)
  * [`client.setGroupPhoto()`](#setGroupPhoto)
  * [`client.muteThread()`](#muteThread)
  * [`client.unmuteThread()`](#unmuteThread)
  * [`client.deleteThread()`](#deleteThread)
* [User Information](#user-information)
  * [`client.getUserInfo()`](#getUserInfo)
  * [`client.searchUsers()`](#searchUsers)
* [E2EE (End-to-End Encryption)](#e2ee-end-to-end-encryption)
  * [`client.connectE2EE()`](#connectE2EE)
  * [`client.sendE2EEMessage()`](#sendE2EEMessage)
  * [`client.sendE2EEReaction()`](#sendE2EEReaction)
  * [`client.sendE2EETyping()`](#sendE2EETyping)
  * [`client.editE2EEMessage()`](#editE2EEMessage)
  * [`client.unsendE2EEMessage()`](#unsendE2EEMessage)
* [E2EE Media](#e2ee-media)
  * [`client.sendE2EEImage()`](#sendE2EEImage)
  * [`client.sendE2EEVideo()`](#sendE2EEVideo)
  * [`client.sendE2EEAudio()`](#sendE2EEAudio)
  * [`client.sendE2EEDocument()`](#sendE2EEDocument)
  * [`client.sendE2EESticker()`](#sendE2EESticker)
  * [`client.downloadE2EEMedia()`](#downloadE2EEMedia)
  * [`client.getDeviceData()`](#getDeviceData)
* [Session Management](#session-management)
  * [`client.getCookies()`](#getCookies)
  * [`client.registerPushNotifications()`](#registerPushNotifications)
* [Miscellaneous](#miscellaneous)
  * [`client.unloadLibrary()`](#unloadLibrary)
* [Utilities](#utilities)
  * [`Utils.parseCookies()`](#parseCookies)
  * [`Utils.validate()`](#validate)
  * [`Utils.getMissing()`](#getMissing)
  * [`isThumbsUpSticker()`](#isThumbsUpSticker)
  * [`extractUrlFromLPHP()`](#extractUrlFromLPHP)
  * [`THUMBS_UP_STICKER_IDS`](#THUMBS_UP_STICKER_IDS)
* [Events](#events)
  * [`ready`](#event-ready) 🔵🟢
  * [`reconnected`](#event-reconnected) 🔵🟢
  * [`message`](#event-message) 🔵
  * [`messageEdit`](#event-messageEdit) 🔵🟢
  * [`messageUnsend`](#event-messageUnsend) 🔵🟢
  * [`reaction`](#event-reaction) 🔵
  * [`typing`](#event-typing) 🔵
  * [`readReceipt`](#event-readReceipt) 🔵
  * [`e2eeMessage`](#event-e2eeMessage) 🟢
  * [`e2eeReaction`](#event-e2eeReaction) 🟢
  * [`e2eeReceipt`](#event-e2eeReceipt) 🟢
  * [`e2eeConnected`](#event-e2eeConnected) 🟢
  * [`fullyReady`](#event-fullyReady) 🔵🟢
  * [`disconnected`](#event-disconnected) 🔵🟢
  * [`error`](#event-error) 🔵🟢
  * [`deviceDataChanged`](#event-deviceDataChanged) 🟢
  * [`raw`](#event-raw) 🔵🟢
* [Types](#types)

---

## Cookie Security

**Read this section carefully** before copy+pasting the examples below.

You **should not** store cookies directly in your code. Reasons:
* Others may see your code and obtain your cookies
* Code backups may be read by others
* You cannot push code to Github without removing cookies. Note: Even if you undo the commit containing cookies, Git still stores them and they can be read
* If you change cookies in the future, you must edit all places in your code

The recommended approach is to save cookies to a separate file:

```typescript
import { readFileSync } from 'fs'
import { Utils } from 'meta-messenger.js'

const cookies = Utils.parseCookies(readFileSync('cookies.json', 'utf-8'))
```

Or use environment variables:
```typescript
const cookies = {
    c_user: process.env.FB_C_USER,
    xs: process.env.FB_XS,
    // other cookies...
}
```

---

# Client

<a name="constructor"></a>
## new Client(cookies, options?)

Create a new client to connect to Messenger.

__Parameters__

* `cookies`: Object containing required cookies (`c_user`, `xs`). Other cookies like `datr`, `fr` are optional.
* `options` (optional): Configuration object:
  * `platform`: `'facebook'` | `'messenger'` | `'instagram'` - Platform for cookies [Library currently only tested with `'facebook'`] (default: `'facebook'`)
  * `enableE2EE`: Boolean - Enable end-to-end encryption (for Messenger) (default: `true`)
  * `devicePath`: String - Path to file for storing device data (for E2EE)
  * `deviceData`: String - Saved device data (JSON string) (takes priority)
  * `e2eeMemoryOnly`: Boolean - If true, E2EE state is stored in memory only (no file, no events). State will be lost on disconnect. (default: `true`)
  * `logLevel`: `'none'` | `'error'` | `'warn'` | `'info'` | `'debug'` | `'trace'` (default: `'none'`)
  * `autoReconnect`: Boolean - Auto reconnect on disconnect (default: `true`)

__Example__

```typescript
import { Client } from 'meta-messenger.js'

const cookies = {
    c_user: '100000000000000',
    xs: '48:abc123...',
    datr: 'xyz789...',
    fr: '1QO0u...'
}

const client = new Client(cookies)
```

---

<a name="connect"></a>
## client.connect()

Connect to Messenger. Returns a Promise with user info and initial data.

__Returns__

Promise<{ user: User, initialData: InitialData }>

* `user`: Logged-in user information
  * `id`: bigint - Facebook ID
  * `name`: string - Display name
  * `username`: string - Username
* `initialData`: Initial data
  * `threads`: Thread[] - List of recent threads
  * `messages`: Message[] - Recent messages

__Example__

```typescript
const { user, initialData } = await client.connect()
console.log(`Logged in: ${user.name} (${user.id})`)
console.log(`Thread count: ${initialData.threads.length}`)
```

---

<a name="disconnect"></a>
## client.disconnect()

Disconnect from Messenger.

__Example__

```typescript
await client.disconnect()
console.log('Disconnected')
```

---

<a name="isFullyReady"></a>
## client.isFullyReady()

Check if client is fully ready (socket + E2EE if enabled).

__Example__

```typescript
console.log(client.isFullyReady())
```

---

<a name="properties"></a>
## Properties

<a name="user"></a>
### client.user

Logged-in user information. `null` if not connected.

__Type:__ `User | null`

---

<a name="currentUserId"></a>
### client.currentUserId

Facebook ID of the current user. `null` if not connected.

__Type:__ `bigint | null`

---

<a name="initialData"></a>
### client.initialData

Initial data (threads and messages). `null` if not connected.

__Type:__ `InitialData | null`

---

<a name="isConnected"></a>
### client.isConnected

Check if client is connected.

__Type:__ `boolean`

---

<a name="isE2EEConnected"></a>
### client.isE2EEConnected

Check if E2EE is connected.

__Type:__ `boolean`

---

# Regular Messages

<a name="sendMessage"></a>
## client.sendMessage(threadId, options)

Send a text message to a thread.

__Parameters__

* `threadId`: bigint - Thread ID.
* `options`: string | SendMessageOptions
  * If string: Send a simple text message
  * If object:
    * `text`: string - Message content
    * `replyToId?`: string - Message ID to reply to
    * `attachmentFbIds?`: bigint[] - Pre-uploaded attachment Facebook IDs (from `uploadMedia()`)
    * `mentions?`: Mention[] - List of mentions
      * `userId`: bigint - Mentioned user ID
      * `offset`: number - Start position in text
      * `length`: number - Length of mention

__Returns__

Promise<SendMessageResult>
* `messageId`: string - Sent message ID
* `timestampMs`: bigint - Timestamp (milliseconds)

__Example__

```typescript
// Simple message
await client.sendMessage(threadId, 'Hello!')

// Message with reply
await client.sendMessage(threadId, {
    text: 'This is a reply',
    replyToId: 'mid.$abc123'
})

// Message with mention
await client.sendMessage(threadId, {
    text: 'Hello @friend!',
    mentions: [{
        userId: 100000000000001n,
        offset: 6,
        length: 7
    }]
})

// Send with pre-uploaded attachments
const upload = await client.uploadMedia(threadId, imageData, 'photo.jpg', 'image/jpeg')
await client.sendMessage(threadId, {
    text: 'Check this out!',
    attachmentFbIds: [upload.fbId]
})
```

---

<a name="sendReaction"></a>
## client.sendReaction(threadId, messageId, emoji?)

Send or remove a reaction on a message.

__Parameters__

* `threadId`: bigint - Thread ID
* `messageId`: string - Message ID to react to
* `emoji?`: string - Reaction emoji (omit to remove reaction)

__Example__

```typescript
// Add reaction
await client.sendReaction(threadId, messageId, '👍')

// Remove reaction
await client.sendReaction(threadId, messageId)
```

---

<a name="editMessage"></a>
## client.editMessage(messageId, newText)

Edit a sent message.

__Parameters__

* `messageId`: string - Message ID to edit
* `newText`: string - New content

__Example__

```typescript
await client.editMessage('mid.$abc123', 'Edited content')
```

---

<a name="unsendMessage"></a>
## client.unsendMessage(messageId)

Unsend (delete) a sent message.

__Parameters__

* `messageId`: string - Message ID to unsend

__Example__

```typescript
await client.unsendMessage('mid.$abc123')
```

---

<a name="sendTypingIndicator"></a>
## client.sendTypingIndicator(threadId, isTyping?, isGroup?)

Send typing indicator.

__Parameters__

* `threadId`: bigint - Thread ID
* `isTyping?`: boolean - `true` to start, `false` to stop (default: `true`)
* `isGroup?`: boolean - `true` if group chat (default: `false`)

__Example__

```typescript
// Start typing
await client.sendTypingIndicator(threadId, true)

// Stop typing after 2 seconds
setTimeout(async () => {
    await client.sendTypingIndicator(threadId, false)
}, 2000)
```

---

<a name="markAsRead"></a>
## client.markAsRead(threadId, watermarkTs?)

Mark a thread as read.

__Parameters__

* `threadId`: bigint - Thread ID
* `watermarkTs?`: number - Watermark timestamp (default: current time)

__Example__

```typescript
await client.markAsRead(threadId)
```

---

# Media

<a name="sendImage"></a>
## client.sendImage(threadId, data, filename, options?)

Send an image.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer - Image data
* `filename`: string - Filename
* `options?`: string | object - Caption string or options object
  * `caption?`: string - Caption
  * `replyToId?`: string - Message ID to reply to

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
import { readFileSync } from 'fs'

const image = readFileSync('photo.jpg')
// Simple caption
await client.sendImage(threadId, image, 'photo.jpg', 'Nice photo!')

// With reply
await client.sendImage(threadId, image, 'photo.jpg', {
    caption: 'Nice photo!',
    replyToId: 'mid.xxx'
})
```

---

<a name="sendVideo"></a>
## client.sendVideo(threadId, data, filename, options?)

Send a video.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer - Video data
* `filename`: string - Filename
* `options?`: string | object - Caption string or options object
  * `caption?`: string - Caption
  * `replyToId?`: string - Message ID to reply to

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
const video = readFileSync('video.mp4')
await client.sendVideo(threadId, video, 'video.mp4', 'Cool video!')

// With reply
await client.sendVideo(threadId, video, 'video.mp4', {
    caption: 'Cool video!',
    replyToId: 'mid.xxx'
})
```

---

<a name="sendVoice"></a>
## client.sendVoice(threadId, data, filename, options?)

Send a voice message.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer - Audio data
* `filename`: string - Filename
* `options?`: object - Options
  * `replyToId?`: string - Message ID to reply to

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
const voice = readFileSync('voice.mp3')
await client.sendVoice(threadId, voice, 'voice.mp3')

// With reply
await client.sendVoice(threadId, voice, 'voice.mp3', { replyToId: 'mid.xxx' })
```

---

<a name="sendFile"></a>
## client.sendFile(threadId, data, filename, mimeType, options?)

Send any file.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer - File data
* `filename`: string - Filename
* `mimeType`: string - MIME type (e.g., 'application/pdf')
* `options?`: string | object - Caption string or options object
  * `caption?`: string - Caption
  * `replyToId?`: string - Message ID to reply to

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
const pdf = readFileSync('document.pdf')
await client.sendFile(threadId, pdf, 'document.pdf', 'application/pdf', 'Document')

// With reply
await client.sendFile(threadId, pdf, 'document.pdf', 'application/pdf', {
    caption: 'Document',
    replyToId: 'mid.xxx'
})
```

---

<a name="sendSticker"></a>
## client.sendSticker(threadId, stickerId, options?)

Send a sticker.

__Parameters__

* `threadId`: bigint - Thread ID
* `stickerId`: bigint - Sticker ID
* `options?`: object - Options
  * `replyToId?`: string - Message ID to reply to

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
// Send thumbs up sticker
await client.sendSticker(threadId, 369239263222822n)

// Reply with sticker
await client.sendSticker(threadId, 369239263222822n, { replyToId: 'mid.xxx' })
```

---

<a name="uploadMedia"></a>
## client.uploadMedia(threadId, data, filename, mimeType)

Upload media and get ID for later use.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer - File data
* `filename`: string - Filename
* `mimeType`: string - MIME type

__Returns__

Promise<UploadMediaResult>
* `fbId`: bigint - Facebook ID of media
* `filename`: string - Filename

__Example__

```typescript
const image = readFileSync('photo.jpg')
const result = await client.uploadMedia(threadId, image, 'photo.jpg', 'image/jpeg')
console.log(`Uploaded: ${result.fbId}`)
```

---

# Thread/Group Management

<a name="createThread"></a>
## client.createThread(userId)

Create a 1:1 thread with a user.

__Parameters__

* `userId`: bigint - User ID

__Returns__

Promise<CreateThreadResult>
* `threadId`: bigint - New thread ID

__Example__

```typescript
const { threadId } = await client.createThread(100000000000001n)
await client.sendMessage(threadId, 'Hello!')
```

---

<a name="renameThread"></a>
## client.renameThread(threadId, newName)

Rename a group chat.

__Parameters__

* `threadId`: bigint - Thread ID
* `newName`: string - New name

__Example__

```typescript
await client.renameThread(threadId, 'Best Friends')
```

---

<a name="setGroupPhoto"></a>
## client.setGroupPhoto(threadId, data, mimeType?)

Change the group avatar.

__Parameters__

* `threadId`: bigint - Thread ID
* `data`: Buffer | string - Image data (Buffer or base64 string)
* `mimeType?`: string - MIME type (default: 'image/jpeg')

__Note__

Messenger web does not support removing group photo, only changing.

__Example__

```typescript
const photo = readFileSync('group-photo.jpg')
await client.setGroupPhoto(threadId, photo, 'image/jpeg')
```

---

<a name="muteThread"></a>
## client.muteThread(threadId, seconds?)

Mute thread notifications.

__Parameters__

* `threadId`: bigint - Thread ID
* `seconds?`: number - Mute duration (seconds)
  * `-1`: Mute forever (default)
  * `0`: Unmute
  * `> 0`: Mute for the specified duration

__Example__

```typescript
// Mute forever
await client.muteThread(threadId)

// Mute for 1 hour
await client.muteThread(threadId, 3600)
```

---

<a name="unmuteThread"></a>
## client.unmuteThread(threadId)

Unmute thread notifications.

__Parameters__

* `threadId`: bigint - Thread ID

__Example__

```typescript
await client.unmuteThread(threadId)
```

---

<a name="deleteThread"></a>
## client.deleteThread(threadId)

Delete a thread.

__Parameters__

* `threadId`: bigint - Thread ID

__Warning__

This action cannot be undone!

__Example__

```typescript
await client.deleteThread(threadId)
```

---

# User Information

<a name="getUserInfo"></a>
## client.getUserInfo(userId)

Get detailed information about a user.

__Parameters__

* `userId`: bigint - User ID

__Returns__

Promise<UserInfo>
* `id`: bigint - Facebook ID
* `name`: string - Full name
* `firstName?`: string - First name
* `username?`: string - Username
* `profilePictureUrl?`: string - Profile picture URL
* `isMessengerUser?`: boolean - Uses Messenger
* `isVerified?`: boolean - Verified account
* `gender?`: number - Gender
* `canViewerMessage?`: boolean - Can message

__Example__

```typescript
const user = await client.getUserInfo(100000000000001n)
console.log(`${user.name} (@${user.username})`)
```

---

<a name="searchUsers"></a>
## client.searchUsers(query)

Search users by name or username.

__Parameters__

* `query`: string - Search keyword

__Returns__

Promise<SearchUserResult[]>
* `id`: bigint - Facebook ID
* `name`: string - Name
* `username`: string - Username

__Example__

```typescript
const users = await client.searchUsers('John Doe')
for (const user of users) {
    console.log(`${user.name} (${user.id})`)
}
```

---

# E2EE (End-to-End Encryption)

<a name="connectE2EE"></a>
## client.connectE2EE()

Connect E2EE. Usually called automatically if `enableE2EE: true`.

__Note__

This Promise resolves when the function completes, not when E2EE is fully connected. Listen for the `e2eeConnected` or `fullyReady` event.

__Example__

```typescript
await client.connectE2EE()
// Wait for e2eeConnected event
```

---

<a name="sendE2EEMessage"></a>
## client.sendE2EEMessage(chatJid, text, options?)

Send an E2EE message.

__Parameters__

* `chatJid`: string - Chat JID (format: `user_id@msgr.fb`)
* `text`: string - Message content
* `options?`: object
  * `replyToId?`: string - Message ID to reply to
  * `replyToSenderJid?`: string - JID of the reply message sender

__Returns__

Promise<SendMessageResult>

__Example__

```typescript
await client.sendE2EEMessage('100000000000001@msgr.fb', 'Hello!')

// Reply
await client.sendE2EEMessage('100000000000001@msgr.fb', 'This is a reply', {
    replyToId: 'msgid123',
    replyToSenderJid: '100000000000002@msgr.fb'
})
```

---

<a name="sendE2EEReaction"></a>
## client.sendE2EEReaction(chatJid, messageId, senderJid, emoji?)

Send/remove E2EE reaction.

__Parameters__

* `chatJid`: string - Chat JID
* `messageId`: string - Message ID
* `senderJid`: string - JID of the original message sender
* `emoji?`: string - Emoji (omit to remove)

__Example__

```typescript
await client.sendE2EEReaction(chatJid, messageId, senderJid, '❤️')
```

---

<a name="sendE2EETyping"></a>
## client.sendE2EETyping(chatJid, isTyping?)

Send typing indicator in an E2EE chat.

__Parameters__

* `chatJid`: string - Chat JID
* `isTyping?`: boolean - Whether typing (default: true)

__Example__

```typescript
// Start typing
await client.sendE2EETyping(chatJid, true)

// Stop typing
await client.sendE2EETyping(chatJid, false)
```

---

<a name="editE2EEMessage"></a>
## client.editE2EEMessage(chatJid, messageId, newText)

Edit an E2EE message.

__Parameters__

* `chatJid`: string - Chat JID
* `messageId`: string - Message ID
* `newText`: string - New content

__Example__

```typescript
await client.editE2EEMessage(chatJid, messageId, 'Edited content')
```

---

<a name="unsendE2EEMessage"></a>
## client.unsendE2EEMessage(chatJid, messageId)

Unsend an E2EE message.

__Parameters__

* `chatJid`: string - Chat JID
* `messageId`: string - Message ID

__Example__

```typescript
await client.unsendE2EEMessage(chatJid, messageId)
```

---

# E2EE Media

<a name="sendE2EEImage"></a>
## client.sendE2EEImage(chatJid, data, mimeType?, options?)

Send an E2EE image.

__Parameters__

* `chatJid`: string - Chat JID
* `data`: Buffer - Image data
* `mimeType?`: string - MIME type (default: 'image/jpeg')
* `options?`: object
  * `caption?`: string - Caption
  * `width?`: number - Width
  * `height?`: number - Height
  * `replyToId?`: string - Reply message ID
  * `replyToSenderJid?`: string - Sender JID

__Example__

```typescript
const image = readFileSync('photo.jpg')
await client.sendE2EEImage(chatJid, image, 'image/jpeg', {
    caption: 'Nice photo!'
})
```

---

<a name="sendE2EEVideo"></a>
## client.sendE2EEVideo(chatJid, data, mimeType?, options?)

Send an E2EE video.

__Parameters__

* `chatJid`: string - Chat JID
* `data`: Buffer - Video data
* `mimeType?`: string - MIME type (default: 'video/mp4')
* `options?`: object
  * `caption?`: string - Caption
  * `width?`: number - Width
  * `height?`: number - Height
  * `duration?`: number - Duration (seconds)
  * `replyToId?`: string - Reply message ID
  * `replyToSenderJid?`: string - Sender JID

__Example__

```typescript
const video = readFileSync('video.mp4')
await client.sendE2EEVideo(chatJid, video, 'video/mp4', {
    caption: 'Cool video!',
    duration: 30
})
```

---

<a name="sendE2EEAudio"></a>
## client.sendE2EEAudio(chatJid, data, mimeType?, options?)

Send E2EE audio/voice.

__Parameters__

* `chatJid`: string - Chat JID
* `data`: Buffer - Audio data
* `mimeType?`: string - MIME type (default: 'audio/ogg')
* `options?`: object
  * `ptt?`: boolean - Push-to-talk/voice message (default: false)
  * `duration?`: number - Duration (seconds)
  * `replyToId?`: string - Reply message ID
  * `replyToSenderJid?`: string - Sender JID

__Example__

```typescript
const voice = readFileSync('voice.ogg')
await client.sendE2EEAudio(chatJid, voice, 'audio/ogg', {
    ptt: true,
    duration: 10
})
```

---

<a name="sendE2EEDocument"></a>
## client.sendE2EEDocument(chatJid, data, filename, mimeType, options?)

Send E2EE file/document.

__Parameters__

* `chatJid`: string - Chat JID
* `data`: Buffer - File data
* `filename`: string - Filename
* `mimeType`: string - MIME type
* `options?`: object
  * `replyToId?`: string - Reply message ID
  * `replyToSenderJid?`: string - Sender JID

__Example__

```typescript
const pdf = readFileSync('document.pdf')
await client.sendE2EEDocument(chatJid, pdf, 'document.pdf', 'application/pdf')
```

---

<a name="sendE2EESticker"></a>
## client.sendE2EESticker(chatJid, data, mimeType?, options?)

Send E2EE sticker.

__Parameters__

* `chatJid`: string - Chat JID
* `data`: Buffer - Sticker data (WebP format)
* `mimeType?`: string - MIME type (default: 'image/webp')
* `options?`: object
  * `replyToId?`: string - Reply message ID
  * `replyToSenderJid?`: string - Sender JID

__Example__

```typescript
const sticker = readFileSync('sticker.webp')
await client.sendE2EESticker(chatJid, sticker, 'image/webp')
```

---

<a name="downloadE2EEMedia"></a>
## client.downloadE2EEMedia(options)

Download and decrypt E2EE media from an attachment.

__Parameters__

* `options`: object
  * `directPath`: string - Direct path from attachment
  * `mediaKey`: string - Base64 encoded media key
  * `mediaSha256`: string - Base64 encoded file SHA256
  * `mediaEncSha256?`: string - Base64 encoded encrypted file SHA256 (recommended for verification)
  * `mediaType`: string - Media type: `'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'`
  * `mimeType`: string - MIME type (e.g., 'image/jpeg')
  * `fileSize`: bigint - File size in bytes

__Returns__

Promise<{ data: Buffer; mimeType: string; fileSize: bigint }>
* `data`: Buffer - Decrypted media data
* `mimeType`: string - MIME type
* `fileSize`: bigint - File size

__Example__

```typescript
import { writeFileSync } from 'fs'

client.on('e2eeMessage', async (message) => {
    if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0]
        
        // Check if attachment has required E2EE metadata
        if (attachment.mediaKey && attachment.mediaSha256 && attachment.directPath) {
            try {
                const result = await client.downloadE2EEMedia({
                    directPath: attachment.directPath,
                    mediaKey: attachment.mediaKey,
                    mediaSha256: attachment.mediaSha256,
                    mediaEncSha256: attachment.mediaEncSha256, // Optional but recommended
                    mediaType: attachment.type,
                    mimeType: attachment.mimeType || 'application/octet-stream',
                    fileSize: attachment.fileSize || 0,
                })
                
                // Save to file
                const extension = result.mimeType.split('/')[1] || 'bin'
                writeFileSync(`downloaded.${extension}`, result.data)
                console.log(`Downloaded ${result.fileSize} bytes`)
            } catch (error) {
                console.error('Failed to download E2EE media:', error)
            }
        }
    }
})
```

__Note__

This method only works for E2EE (end-to-end encrypted) messages. For regular messages, use the `url` field in the attachment instead.

---

<a name="getDeviceData"></a>
## client.getDeviceData()

Get E2EE device data for storage.

__Returns__

string - Device data as JSON string

__Note__

Save device data to avoid setting up E2EE again on each startup.

__Example__

```typescript
import { writeFileSync } from 'fs'

// Save device data
const deviceData = client.getDeviceData()
writeFileSync('device.json', deviceData)

// Load on startup
const client = new Client(cookies, {
    deviceData: readFileSync('device.json', 'utf-8')
})
```

---

# Session Management

<a name="getCookies"></a>
## client.getCookies()

Get the current cookies from the internal client state. Useful for exporting refreshed cookies.

__Returns__

Record<string, string> - Current cookies as key-value object

__Note__

Meta servers may refresh session cookies during operation. Use this method to export the latest cookies for storage.

__Example__

```typescript
import { writeFileSync } from 'fs'

// Export current cookies (may have been refreshed)
const cookies = client.getCookies()
writeFileSync('cookies.json', JSON.stringify(cookies))
```

---

<a name="registerPushNotifications"></a>
## client.registerPushNotifications(endpoint, keys)

Register for web push notifications. This allows receiving push notifications from Meta servers.

__Parameters__

* `endpoint`: string - Push notification endpoint URL
* `keys`: object - Push notification keys
  * `p256dh`: string - P256DH key (base64 URL-safe encoded)
  * `auth`: string - Auth key (base64 URL-safe encoded)

__Returns__

Promise<void>

__Note__

This is an advanced feature for implementing push notifications. Requires a valid VAPID key pair and push subscription.

__Example__

```typescript
// Example with web-push library setup
await client.registerPushNotifications('https://fcm.googleapis.com/fcm/send/...', {
    p256dh: 'base64-encoded-p256dh-key',
    auth: 'base64-encoded-auth-key'
})
```

---

# Miscellaneous

<a name="unloadLibrary"></a>
## client.unloadLibrary()

Unload the native library from memory.

__Warning__

After calling this method, any operation with the client will crash. Only use when you need to fully cleanup before shutting down the application.

__Example__

```typescript
await client.disconnect()
client.unloadLibrary()
// Do not use client after this!
```

---

# Utilities

<a name="parseCookies"></a>
## Utils.parseCookies(input)

Parse cookies from various formats.

__Parameters__

* `input`: string - Cookies in the form of:
  * JSON array: `[{ "name": "c_user", "value": "..." }, ...]`
  * JSON object: `{ "c_user": "...", "xs": "..." }`
  * Cookie string: `"c_user=...; xs=..."`
  * Netscape format
  * Base64 encoded (any format above)

__Returns__

Cookies - Object with key-value pairs

__Example__

```typescript
import { Utils } from 'meta-messenger.js'
import { readFileSync } from 'fs'

const cookies = Utils.parseCookies(readFileSync('cookies.json', 'utf-8'))
```

---

<a name="validate"></a>
## Utils.validate(cookies)

Check if cookies have all required fields.

__Parameters__

* `cookies`: Cookies - Cookies object

__Returns__

boolean - `true` if valid

__Example__

```typescript
if (!Utils.validate(cookies)) {
    console.error('Invalid cookies!')
}
```

---

<a name="getMissing"></a>
## Utils.getMissing(cookies)

Get list of missing required cookies.

__Parameters__

* `cookies`: Cookies - Cookies object

__Returns__

string[] - List of missing cookie names

__Example__

```typescript
const missing = Utils.getMissing(cookies)
if (missing.length > 0) {
    console.error(`Missing cookies: ${missing.join(', ')}`)
}
```

---

<a name="isThumbsUpSticker"></a>
## isThumbsUpSticker(stickerId)

Check if a sticker ID is a thumbs-up sticker.

Facebook Messenger displays a special "thumbs up" button that sends a sticker. There are 3 variants depending on how long the user holds the button. This function checks if a sticker ID is one of these thumbs-up stickers.

__Parameters__

* `stickerId`: number | undefined - The sticker ID to check

__Returns__

boolean - True if this is a thumbs-up sticker

__Example__

```typescript
import { isThumbsUpSticker } from 'meta-messenger.js'

client.on('message', (msg) => {
    for (const att of msg.attachments || []) {
        if (att.type === 'sticker' && isThumbsUpSticker(att.stickerId)) {
            console.log('User sent a thumbs up! 👍')
        }
    }
})
```

---

<a name="extractUrlFromLPHP"></a>
## extractUrlFromLPHP(url)

Extract actual URL from Facebook's l.php redirect URL.

Facebook wraps external URLs in a tracking redirect (l.php). This function extracts the original URL from the redirect.

__Parameters__

* `url`: string - The URL to parse (may be an l.php redirect)

__Returns__

string - The extracted URL or the original URL if not a redirect

__Example__

```typescript
import { extractUrlFromLPHP } from 'meta-messenger.js'

const actualUrl = extractUrlFromLPHP('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com')
// Returns: 'https://example.com'

// Non-redirect URLs are returned as-is
const normalUrl = extractUrlFromLPHP('https://example.com')
// Returns: 'https://example.com'
```

---

<a name="THUMBS_UP_STICKER_IDS"></a>
## THUMBS_UP_STICKER_IDS

Constants for Facebook thumbs-up sticker IDs.

These are the sticker IDs sent when someone presses the thumbs-up button in Messenger. There are three variants depending on how long the sending user held down the send button.

__Values__

* `THUMBS_UP_STICKER_IDS.SMALL`: 369239263222822
* `THUMBS_UP_STICKER_IDS.MEDIUM`: 369239343222814
* `THUMBS_UP_STICKER_IDS.LARGE`: 369239383222810

__Example__

```typescript
import { THUMBS_UP_STICKER_IDS } from 'meta-messenger.js'

if (attachment.stickerId === THUMBS_UP_STICKER_IDS.LARGE) {
    console.log('User held the button for a long time!')
}
```

---

# Events

> **Legend:**
> - 🔵 **Regular** = Regular messages (unencrypted)
> - 🟢 **E2EE** = End-to-end encrypted messages

| Event | Regular | E2EE | Description |
|-------|:-------:|:----:|-------------|
| `ready` | 🔵 | ❌ | Socket connection successful |
| `reconnected` | 🔵 | ❌ | Reconnection successful |
| `message` | 🔵 | ❌ | New regular message |
| `e2eeMessage` | ❌ | 🟢 | New E2EE message |
| `messageEdit` | 🔵 | 🟢 | Message edited |
| `messageUnsend` | 🔵 | 🟢 | Message unsent |
| `reaction` | 🔵 | ❌ | Regular message reaction |
| `e2eeReaction` | ❌ | 🟢 | E2EE message reaction |
| `typing` | 🔵 | ❌ | Typing indicator (regular) |
| `readReceipt` | 🔵 | ❌ | Message read (regular) |
| `e2eeReceipt` | ❌ | 🟢 | Message read (E2EE) |
| `e2eeConnected` | ❌ | 🟢 | E2EE connection successful |
| `deviceDataChanged` | ❌ | 🟢 | Device data changed |
| `raw` | 🔵 | 🟢 | Raw event from LightSpeed/whatsmeow |
| `fullyReady` | 🔵 | 🟢 | Client fully ready |
| `disconnected` | 🔵 | 🟢 | Disconnected |
| `error` | 🔵 | 🟢 | Error occurred |

---

<a name="event-ready"></a>
## Event: 'ready'

> 🔵 **Socket connection**

Emitted when socket connection is successful (before E2EE).

```typescript
client.on('ready', (data) => {
    console.log('Socket connected!')
    if (data.isNewSession) {
        console.log('This is a new session')
    }
})
```

__Data object__

* `isNewSession`: boolean - `true` if new connection session

---

<a name="event-reconnected"></a>
## Event: 'reconnected'

> 🔵 **Socket reconnection**

Emitted when socket reconnection is successful after disconnection.

```typescript
client.on('reconnected', () => {
    console.log('Reconnected to Messenger!')
})
```

---

<a name="event-message"></a>
## Event: 'message'

> 🔵 **Regular messages only**

Emitted when a new regular message is received.

```typescript
client.on('message', (message: Message) => {
    console.log(`${message.senderId}: ${message.text}`)
})
```

__Message object__

* `id`: string - Message ID
* `threadId`: bigint - Thread ID
* `senderId`: bigint - Sender ID
* `text`: string - Content
* `timestampMs`: bigint - Timestamp
* `attachments?`: Attachment[] - Attachments
* `replyTo?`: ReplyTo - Reply info
* `mentions?`: Mention[] - Mentions
* `isAdminMsg?`: boolean - System message

---

<a name="event-messageEdit"></a>
## Event: 'messageEdit'

> 🔵🟢 **Supports both regular and E2EE messages**

Emitted when a message is edited (both regular and E2EE).

```typescript
client.on('messageEdit', (data) => {
    console.log(`Message ${data.messageId} edited to: ${data.newText}`)
})
```

__Data object__

* `messageId`: string - Message ID
* `newText`: string - New content
* `editCount?`: bigint - Edit count
* `timestampMs`: bigint - Edit timestamp

---

<a name="event-messageUnsend"></a>
## Event: 'messageUnsend'

> 🔵🟢 **Supports both regular and E2EE messages**

Emitted when a message is unsent (both regular and E2EE).

```typescript
client.on('messageUnsend', (data) => {
    console.log(`Message ${data.messageId} unsent in thread ${data.threadId}`)
})
```

__Data object__

* `messageId`: string - Message ID
* `threadId`: bigint - Thread ID

---

<a name="event-reaction"></a>
## Event: 'reaction'

> 🔵 **Regular messages only** - See [`e2eeReaction`](#event-e2eeReaction) for E2EE

Emitted when a new reaction is added to a regular message.

```typescript
client.on('reaction', (data) => {
    console.log(`${data.actorId} reacted ${data.reaction} to ${data.messageId}`)
})
```

__Data object__

* `messageId`: string - Message ID
* `threadId`: bigint - Thread ID
* `actorId`: bigint - Reactor ID
* `reaction`: string - Emoji (empty = removed reaction)

---

<a name="event-typing"></a>
## Event: 'typing'

> 🔵 **Regular messages only**

Emitted when someone is typing in a regular thread.

```typescript
client.on('typing', (data) => {
    console.log(`${data.senderId} is ${data.isTyping ? 'typing' : 'stopped typing'}`)
})
```

__Data object__

* `threadId`: bigint - Thread ID
* `senderId`: bigint - Typer ID
* `isTyping`: boolean - Typing or stopped

---

<a name="event-readReceipt"></a>
## Event: 'readReceipt'

> 🔵 **Regular messages only** - See [`e2eeReceipt`](#event-e2eeReceipt) for E2EE

Emitted when a regular message is read.

```typescript
client.on('readReceipt', (data) => {
    console.log(`${data.readerId} read messages in ${data.threadId}`)
})
```

__Data object__

* `threadId`: bigint - Thread ID
* `readerId`: bigint - Reader ID
* `readWatermarkTimestampMs`: bigint - Read watermark timestamp
* `timestampMs?`: bigint - Read time

---

<a name="event-e2eeMessage"></a>
## Event: 'e2eeMessage'

> 🟢 **E2EE messages only** - See [`message`](#event-message) for regular messages

Emitted when a new E2EE message is received.

```typescript
client.on('e2eeMessage', (message: E2EEMessage) => {
    console.log(`[E2EE] ${message.senderJid}: ${message.text}`)
})
```

__E2EEMessage object__

* `id`: string - Message ID
* `threadId`: bigint - Thread ID
* `chatJid`: string - Chat JID
* `senderJid`: string - Sender JID
* `senderId`: bigint - Sender ID
* `text`: string - Content
* `timestampMs`: bigint - Timestamp
* `attachments?`: Attachment[]
* `replyTo?`: ReplyTo
* `mentions?`: Mention[]

---

<a name="event-e2eeReaction"></a>
## Event: 'e2eeReaction'

> 🟢 **E2EE messages only** - See [`reaction`](#event-reaction) for regular messages

Emitted when a reaction is added to an E2EE message.

```typescript
client.on('e2eeReaction', (data) => {
    console.log(`${data.senderJid} reacted ${data.reaction}`)
})
```

__Data object__

* `messageId`: string - Message ID
* `chatJid`: string - Chat JID
* `senderJid`: string - Reactor JID
* `senderId`: bigint - Reactor ID
* `reaction`: string - Emoji (empty = removed reaction)

---

<a name="event-e2eeReceipt"></a>
## Event: 'e2eeReceipt'

> 🟢 **E2EE messages only** - See [`readReceipt`](#event-readReceipt) for regular messages

Emitted when there's a receipt for E2EE messages (read, delivered, etc.).

```typescript
client.on('e2eeReceipt', (data) => {
    console.log(`[E2EE] Receipt type ${data.type} for messages:`, data.messageIds)
})
```

__Data object__

* `type`: string - Receipt type (`'read'`, `'delivered'`, etc.)
* `chat`: string - Chat JID
* `sender`: string - Sender JID
* `messageIds`: string[] - List of message IDs

---

<a name="event-e2eeConnected"></a>
## Event: 'e2eeConnected'

> 🟢 **E2EE only**

Emitted when E2EE connection is successful.

```typescript
client.on('e2eeConnected', () => {
    console.log('E2EE connected!')
})
```

---

<a name="event-fullyReady"></a>
## Event: 'fullyReady'

> 🔵🟢 **Supports both regular and E2EE**

Emitted when client is fully ready (socket + E2EE if enabled).

```typescript
client.on('fullyReady', () => {
    console.log('Client is ready!')
})
```

__Note__

Message events (message/e2eeMessage) will be queued until `fullyReady` is emitted.

---

<a name="event-disconnected"></a>
## Event: 'disconnected'

> 🔵🟢 **Supports both regular and E2EE**

Emitted when disconnected.

```typescript
client.on('disconnected', (data) => {
    if (data?.isE2EE) {
        console.log('E2EE disconnected')
    } else {
        console.log('Socket disconnected')
    }
})
```

__Data object__

* `isE2EE?`: boolean - `true` if E2EE disconnected

---

<a name="event-error"></a>
## Event: 'error'

> 🔵🟢 **Supports both regular and E2EE**

Emitted when an error occurs. If the error is a permanent error (session invalid, account blocked, etc.), the event loop will automatically stop.

```typescript
client.on('error', (error) => {
    console.error(`Error: ${error.message}`)
})
```

__Parameter__

* `error`: Error - Standard JavaScript Error object

---

<a name="event-deviceDataChanged"></a>
## Event: 'deviceDataChanged'

> 🟢 **E2EE only** - Only when using `deviceData` option

Emitted when E2EE device data changes. Use to save device data to database.

```typescript
client.on('deviceDataChanged', (data) => {
    // Save device data to database
    await saveToDatabase(data.deviceData)
})
```

__Data object__

* `deviceData`: string - Device data as JSON string

__Note__

This event is only emitted when you initialize the client with the `deviceData` option. If using `e2eeDeviceDataPath`, device data will be automatically saved to file.

---

<a name="event-raw"></a>
## Event: 'raw'

> 🔵🟢 **Both Socket and E2EE** - All raw events from LightSpeed and whatsmeow

Emitted for all incoming events from the LightSpeed (regular messages) and whatsmeow (E2EE) channels. This is useful for debugging or accessing raw event data that may not be processed by standard event handlers.

```typescript
client.on('raw', (data) => {
    console.log(`Raw event from ${data.from}: ${data.type}`)
    console.log(data.data)
})
```

__Data object__

* `from`: `'lightspeed'` | `'whatsmeow'` - Source channel of the event
* `type`: string - Name of the event type (e.g., `"Event_Ready"`, `"FBMessage"`)
* `data`: unknown - Raw event data (structure depends on the source)

__Event sources__

| Source | Description |
|--------|-------------|
| `lightspeed` | Events from LightSpeed protocol (regular Messenger) |
| `whatsmeow` | Events from whatsmeow library (E2EE via WhatsApp protocol) |

__Note__

This event is emitted before the standard event handlers process the event. The raw data structure may vary depending on the source and event type. Use this for debugging or handling events not explicitly supported by the library.

---

# Types

## Cookies

```typescript
interface Cookies {
    c_user: string
    xs: string
    datr?: string
    fr?: string
    [key: string]: string | undefined
}
```

## BaseMessage

Base interface shared by regular and E2EE messages.

```typescript
interface BaseMessage {
    id: string              // Message ID
    threadId: bigint        // Thread ID (Facebook numeric ID)
    senderId: bigint        // Sender's Facebook ID
    text: string            // Message text content
    timestampMs: bigint     // Timestamp in milliseconds
    attachments?: Attachment[]
    replyTo?: ReplyTo
    mentions?: Mention[]
}
```

## Message

Regular message (non-E2EE). Extends [BaseMessage](#basemessage). Received via the `message` event.

```typescript
interface Message extends BaseMessage {
    isAdminMsg?: boolean    // Whether this is an admin/system message
}
```

## E2EEMessage

End-to-end encrypted message. Extends [BaseMessage](#basemessage). Received via the `e2eeMessage` event.

```typescript
interface E2EEMessage extends BaseMessage {
    chatJid: string         // Chat JID (required for E2EE operations)
    senderJid: string       // Sender JID (required for E2EE operations)
}
```

## Attachment

```typescript
interface Attachment {
    type: 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'gif' | 'voice' | 'link'
    url?: string
    fileName?: string
    mimeType?: string
    fileSize?: bigint
    width?: number
    height?: number
    duration?: number
    stickerId?: bigint
    previewUrl?: string
    // For link attachments
    description?: string    // Link description/subtitle
    sourceText?: string     // Source domain text
    // For E2EE media download (only available in E2EE messages)
    mediaKey?: string      // Base64 encoded encryption key
    mediaSha256?: string   // Base64 encoded file SHA256
    mediaEncSha256?: string // Base64 encoded encrypted file SHA256
    directPath?: string    // Direct path for download
}
```

## ReplyTo

```typescript
interface ReplyTo {
    messageId: string
    senderId?: bigint
    text?: string
}
```

## Mention

```typescript
interface Mention {
    userId: bigint
    offset: number
    length: number
    /** Mention type: user (person), page, group, or thread */
    type?: 'user' | 'page' | 'group' | 'thread'
}
```

## Thread

```typescript
interface Thread {
    id: bigint
    type: number
    name: string
    lastActivityTimestampMs: bigint
    isGroup?: boolean
    participants?: bigint[]
}
```

## User

```typescript
interface User {
    id: bigint
    name: string
    username: string
}
```

## UserInfo

```typescript
interface UserInfo {
    id: bigint
    name: string
    firstName?: string
    username?: string
    profilePictureUrl?: string
    isMessengerUser?: boolean
    isVerified?: boolean
    gender?: number
    canViewerMessage?: boolean
}
```
