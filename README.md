# Telos Server

## 1 - Abstract

***To Serve Code***

Telos Server is a server built on [Telos Origin](https://github.com/Telos-Project/Telos-Origin),
which operates on a declarative CMS.

## 2 - Contents

### 2.1 - CMS

Telos Server sources its content from the [APInt](https://github.com/Telos-Project/APInt) of Telos
Origin, with URLs to resources and endpoints corresponding to element paths to elements therein,
concatenated together by forward slashes.

A path to a folder which contains a file beginning with "index.", case insensitive, will be
interpreted as a path to said file.

#### 2.1.2 - Properties

##### 2.1.2.1 - API

If a JS file utility has the property "api", it shall serve as an API endpoint.

As such, it shall be expected to use Common JS to assign as the module exports a single function
which takes the request as an [HTTP JSON](https://github.com/Telos-Project/AutoCORS?tab=readme-ov-file#211---http-json)
object, and returns an HTTP JSON object representing the response, or a null value to indicate a
blank response.

##### 2.1.2.2 - Private

If an element has the property "private", it shall be inaccessible from the client.

##### 2.1.2.3 - Universal Preprocessor

If a file utility has the property "pup", it will be processed by the
[Universal Preprocessor](https://github.com/Telos-Project/Universal-Preprocessor) before being
fetched.

### 2.3 - Usage

#### 2.3.1 - Setup

First, create a folder for your project. Within this folder, create your "telos" folder, and
populate it with the content you intend to serve.

Next, navigate to said folder in the terminal, and run the following command:

    npx telos-origin -e install telos-server

If you wish to run the server, which will be on port 80 by default, run the following command:

    npx telos-origin

If you want to deploy your server to a cloud host such as [render.com](https://render.com/), run
the following command after installing telos server and before uploading your project:

    npx telos-origin -e wrap

#### 2.3.2 - Configuration

The default port is port 80, but this can be reconfigured by assigning the desired port as a number
to a "port" field in the options object.

#### 2.3.3 - Middleware

When the Telos Server receives a request, it converts the request into a stringified JSON object
with which it calls the Telos Origin [bus net](https://github.com/Telos-Project/Bus-Net) with. A
bus net module designed to respond to such calls is referred to as a server middleware module.

Said object shall have the tag "telos-server-request", shall have a "request" field, containing the
HTTP request which invoked it in the form of an HTTP JSON object, and shall, if applicable, have a
"file" field, containing the APInt utility from the Telos Origin APInt corresponding to the file
which matches the request URI.

The function may return an HTTP JSON response object representing the response to be returned to
the client. Additional fields may be added to the response object for certain behaviors.

Ideally, only one server middleware module should return a response for each request, but in the
event that there are multiple responses, a "priority" field containing a number may be added to
indicate how the response should be weighed relative to others.

If the response is to return a filestream rather than a text response, the body of the response
shall be set to the path to the streamed resource, and the response object shall have the field
"file", containing a boolean value of true.