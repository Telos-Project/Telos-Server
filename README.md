# Telos Server

## 1 - Abstract

***To Serve Code***

Telos Server is a server built on [Telos Origin](https://github.com/Telos-Project/Telos-Origin),
which operates on a declarative file system based CMS.

## 2 - Contents

### 2.1 - Telos Folder

Telos Server shall source its content and endpoints from a Telos folder, stored on disk, which by
default shall be called "telos", and shall be stored in the same directory the server process runs
from.

File names in the telos folder shall have their names segmented into chunks by periods, with the
first chunk specifying the name of the file, the last chunk specifying the extension, and each
intermediate chunk specifying a property. If a property chunk contains a hyphen, the part preceding
the hyphen shall specify the name of the property, and the part following the hyphen shall specify
the value of the property.

Folder names may be split the same way, though in folders the final chunk will also be a property
chunk rather than an extension. Files will inherit properties from any ancestor folders.

Folder and file paths shall consist of their name chunks concatenated together in order by forward
slashes, with file extensions being optional to resolve conflicts. The telos folder itself shall
not be included. If a folder contains a file with the name chunk "index", the path to said folder
shall redirect to said file.

#### 2.1.1 - Example

If you have the following file path:

    a/b.c/d.e.f-g.h

The paths to this file shall be:

    a/b/d
	a/b/d.h

And its properties will be:

    { "c": true, "e": true, "f": "g" }

#### 2.1.2 - Properties

##### 2.1.2.1 - API

If a JS file has the property "api", it shall serve as an API endpoint. As such, it shall be
expected to use Common JS to assign as the module exports a single function which takes the request
as an [HTTP JSON](https://github.com/Telos-Project/AutoCORS?tab=readme-ov-file#211---http-json)
object, and returns an HTTP JSON object representing the response, or a null value to indicate a
blank response.

##### 2.1.2.2 - Private

If a file has the property "private", it shall be inaccessible from the client.

##### 2.1.2.3 - Task

If a JS file has the property "task", it shall serve as a script in a persistent background
process. It shall use Common JS to assign as the module exports a single function which, at regular
intervals, shall be invoked by an event handler responsive to the Telos engine.

##### 2.1.2.4 - Universal Preprocessor

If a file has the property "pup", it will be processed by the
[Universal Preprocessor](https://github.com/Telos-Project/Universal-Preprocessor) before being
fetched.

### 2.2 - Telos Engine

The Telos engine is a background process embedded in an associated bus module, which is integrated
into, but may be used independently of, Telos Server.

The Telos engine, at regular intervals, calls the bus net of Telos Origin with the following
object:

    { tags: ["telos-engine"] }

The Telos engine also stores a reference to the initialization call object of Telos Origin, which
shall be returned from the Telos engine bus module query function if the following object is passed
to it:

    { tags: ["telos-configuration"] }

The default interval for the Telos engine is 60 times per second. This may be altered using a
number assigned to the content.options.options.engineInterval field in the initialization call
object of Telos Origin specifying how long in seconds to wait between each interval.

### 2.3 - Usage

#### 2.3.1 - Setup

First, create a folder for your project. Within this folder, create your "telos" folder, and
populate it with the content you intend to serve.

Next, navigate to said folder in the terminal, and run the following command:

    npx telos-origin -m install telos-server

If you wish to run the server, which will be on port 80 by default, run the following command:

    npx telos-origin

If you want to deploy your server to a cloud host such as [render.com](https://render.com/), run
the following command before uploading your project:

    npx telos-origin -m wrap

#### 2.3.2 - Configuration

The default port can be reconfigured with a Telos Config utility with the desired port specified as
a numerical field in the properties with the alias "port".

#### 2.3.3 - Middleware

Telos Server may be extended through middleware referenced in the Telos Origin APInt.

The utilities which reference such middleware shall have the "type" property specified as
"telos-server-middleware", and shall reference as their source a CommonJS module which exports an
object with a "middleware" field containing a list of middleware functions.

A middleware function shall take two arguments, the first being the HTTP request which invoked it
it the form of an HTTP JSON object, and the second being a file metadata object specifying
information about the file on disk which matches the request URI. Said metadata object shall have
the fields "file", containing a string specifying the full file path, "meta", containing an object
specifying the properties derived from the file path as shown in section 2.1.1, and "type",
containing a string specifying the file type.

The function may return an HTTP JSON response object representing the response to be returned to
the client. Additional fields may be added to the response object for certain behaviors. Ideally,
only one middleware function should return a response for each request, but in the event that there
are multiple responses, a "priority" field containing a number may be added to indicate how the
response should be weighed relative to others. If the response is to return a filestream rather
than a text response, the body of the response shall be set to the path to the streamed resource,
and the response object shall have the field "file", containing a boolean value of true.