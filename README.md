# Telos Server

## 1 - Abstract

Telos Server is a server built on [Telos Origin](https://github.com/Telos-Project/Telos-Origin),
which operates on a declarative file system based CMS.

## 2 - Contents

### 2.1 - Content

The Telos Server shall source its content and endpoints from a folder on disk, which by default
shall be called "telos", and shall be stored in the same directory the server process runs from.

File names in the telos folder shall have their names segmented into chunks by periods, with the
first chunk specifying the name of the file, the last chunk specifying the extension, and each
intermediate chunk specifying a property. If a property chunk contains a hyphen, the part preceding
the hyphen shall specify the name of the property, and the part following the hypen shall specify
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

##### 2.1.2.3 - Universal Preprocessor

If a file has the property "pup", it will be processed by the
[Universal Preprocessor](https://github.com/Telos-Project/Universal-Preprocessor) before being
fetched.

### 2.2 - Usage

#### 2.2.1 - Setup

First, create a folder for your project. Within this folder, create your "telos" folder, and
populate it with the content you intend to serve.

Next, navigate to said folder in the terminal, and run the following command:

    npx telos-origin -m install telos-server

If you wish to run the server, which will be on port 80 by default, run the following command:

    npx telos-origin

If you want to deploy your server to a cloud host such as [render.com](https://render.com/), run
the following command before uploading your project:

    npx telos-origin -m wrap

#### 2.2.2 - Configuration

The defualt port can be reconfigured with a Telos Config utility with the desired port specified as
a numerical field in the properties with the alias "port".