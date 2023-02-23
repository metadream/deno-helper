# Denos

A compact, high-performance and full-featured web server framework based on deno.

## Shortcut mode

```ts
import { Denos } from "https://esm.sh/denos/mod.ts";

Denos
  .serve("/assets/*")
  .get("/:user", (ctx) => {
    return ctx.params.user;
  })
  .listen();
```

Note that features such as plugins, middlewares, template engine and unified
error handling cannot be used in shortcut mode, you must solve them in other
ways.

## Decorator mode

Importing a ts/tsx file containing any decorators to use its features. Shortcut
mode and decorator mode do not conflict and can be used together. The only
difference in performance between the two is that the latter needs to parse all
decorators at startup, it is almost the same in runtime.

```ts
// main.ts
import { Denos } from "https://esm.sh/denos/mod.ts";
import "./controllers/MyController.ts"; // Do not forget import the controllers

Denos.listen();
```

### 1. Controllers

```ts
// controller.ts
import { Context, Controller, Get } from "https://esm.sh/denos/mod.ts";

@Controller("/prefix")
export class MyController {
  @Get("/:user")
  getUser(ctx: Context) {
    return ctx.params.user;
  }
}
```

### 2. Middlewares

You can add middleware decorator on any class method, including controllers. The
role of the middleware parameter is to set the execution priority.

```ts
// middleware.ts
import { Context, Middleware } from "https://esm.sh/denos/mod.ts";

export class MyMiddleware {
  @Middleware(2)
  cors(ctx: Context) {
    // do something second
  }
  @Middleware(1)
  auth(ctx: Context) {
    // do something first
  }
}
```

### 3. Plugins

Plugin decorators can only be added to classes, and the parameter is the name
bound to the context.

```ts
// plugin.ts
import { Plugin } from "https://esm.sh/denos/mod.ts";

@Plugin("redis")
export class Redis {
  constructor() {
    // connect to redis server and create a client
  }
  get(key) {
    // do something
  }
  set(key, value) {
    // do something
  }
}
```

Then you can use redis object as singleton instance in any controllers with
`ctx.redis`.

### 4. Template

Template decorator is used to decorate controller handlers, the parameters is
template file path. and the built-in engine will be used for rendering
automatically. The built-in engine is based on
[tmplet](https://github.com/metadream/tmplet), You can go to the repo to see the
template syntax.

```ts
// main.ts
Denos.engine({ // Engine options, not necessary
  root: "", // The root of template files
  imports: {} // Global imports for template
})
.listen();

// controller.ts
import { Context, Controller, Get, Template } from "https://esm.sh/denos/mod.ts";

@Controller("/prefix")
export class MyController {
  @Get("/:user")
  @Template("index.html") // or @Template("root/path/index.html") if not initialize engine
  getUser(ctx: Context) {
    return { name: ctx.params.user };
  }
}

// index.html
<h1>Hello, {{= name }}</h1>
```

### 5. JSX

```ts
// controller.ts
/** @jsx h */
import { Context, Controller, Get, h } from "https://esm.sh/denos/mod.ts";

const Homepage = ({ props }: any) => (
  <div>
    <h1>Hello, {props.name}</h1>
  </div>
);

@Controller()
export class JsxController {
  @Get("/jsx")
  jsx(ctx: Context) {
    const data = { name: "jsx" };
    return <Homepage props={data} />;
  }
}
```

### 6. ErrorHandlder

If an error handler decorator is defined, all errors within the framework will
be handled by it. Like middleware, you can define it in any class method but
only once. This decorator has no parameters.

```ts
// error.ts
import { Context, ErrorHandler } from "https://esm.sh/denos/mod.ts";

export class AnyClass {
  @ErrorHandler
  error(ctx: Context) {
    console.log(ctx.error);
  }
}
```

## API Reference

### Constructor

To start the web service, you simply new an instance with
`new Cross(...routes:Route[])`. The instance has two public methods as follow:

- `serve(dir)` "dir" is the relative path of static resources directory. that
  fetched responses are allowed to be used again.
- `listen(port)` HTTP server listening port, default 3000.

### Shortcuts

The shortcut methods including
`all`,`get`,`post`,`put`,`del`,`patch`,`head`,`opt`, and all methods have the
same parameters.

- `path` Route path based on radix tree.
- `callback` Request handle function.

### Decorators

| name           | type            | parameters | parameter description         |
| -------------- | --------------- | ---------- | ----------------------------- |
| @Controller    | ClassDecorator  | string     | Prefix for request route      |
| @Plugin        | ClassDecorator  | string     | Plugin name with context      |
| @All           | MethodDecorator | string     | Route path                    |
| @Get           | MethodDecorator | string     | Route path                    |
| @Post          | MethodDecorator | string     | Route path                    |
| @Put           | MethodDecorator | string     | Route path                    |
| @Delete        | MethodDecorator | string     | Route path                    |
| @Patch         | MethodDecorator | string     | Route path                    |
| @Head          | MethodDecorator | string     | Route path                    |
| @Options       | MethodDecorator | string     | Route path                    |
| @Template      | MethodDecorator | string     | Template file path            |
| @Middleware    | MethodDecorator | number     | Middleware execution priority |
| @ErrorHandlder | MethodDecorator | undefined  |                               |

### Context

Context is an instance passed to controllers, middlewares and error handler, it
contains properties and methods related to requests and responses.

#### Request Properties

- `ctx.params` The parameters with route path
- `ctx.query` The parameters with query string
- `ctx.url` ex. https://example.com:3000/users?page=1
- `ctx.origin` ex. https://example.com:3000
- `ctx.protocol` ex. https:
- `ctx.host` ex. example.com:3000
- `ctx.hostname` ex. example.com
- `ctx.port` ex. 3000
- `ctx.path` ex. /users
- `ctx.method` Standard http request methods
- `ctx.headers` Refer to https://deno.com/deploy/docs/runtime-headers
- `ctx.cookies` Including one method to get request cookie:
  `ctx.cookies.get(name)`
- `ctx.body` Including five parsing methods: `text()`, `json()`, `form()`,
  `blob()`, `buffer()`.
- `ctx.request` Native request instance.

#### Response Properties

- `ctx.status`
- `ctx.status=`
- `ctx.statusText`
- `ctx.statusText=`
- `ctx.cookies` Including two methods to operate response cookie:
  `set(name, value)`,`delete(name)`

#### Response Methods

- `ctx.has(name)`
- `ctx.get(name)`
- `ctx.set(name, value)`
- `ctx.append(name, value)`
- `ctx.delete(name)`
- `ctx.redirect(url[, status])`

#### Others

- `ctx.view(tmplPath, data)` You can return string directly,which will be
  rendered by the @Template decorator.
- `ctx.render(tmplText, data)` Usually not needed
- `ctx.renderJsx(node)` You can return node directly, which will be rendered by
  the framework.
- `ctx.error`
- `ctx.throw(message[, status])`

#### Return types

- `BodyInit`: Blob, BufferSource, FormData, ReadableStream, URLSearchParams, or
  USVString
- `Response`: Native response instance.
