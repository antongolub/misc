## @authograph
> Embeddable auth infra made from scratch

### Challenge
There's a need to control access to resources:
* for several domains
* granular (abac/rbac/pbac)
* declarative / auditable
* with logging / monitoring / alerts
* with gui
* customizable and flexible
* with ttl
* with delegation
* with revocation
* fast (10k+ rps)

Stack: linux + nodejs + pg

### RBAC
The classics: AD with side tokenization. This is what we often have now.
<details>
<summary>Conceptual example</summary>

#### Entities
```ts
type TId = string

// Smth that represents an actor — user or service
type Account = { // aka principal
  id: TId
  type: 'user' | 'service'
  externalId: string // unique by design: ip, email or phone or service name
}

type Group = {
  id: TId
  owner: Account
  description?: string
  externalId: string // unique by contract
  accounts: Account[]
}

// Smth that represents an accessable (abstract) entity
type Resource = {
  id: TId
  owner: Account
  description?: string
  externalId: string // unique by contract
  // attributes: {
  //   [key: string]: string
  // }
}

// Smth that allows the specified operation on resource(s)
type Access = {
  id: TId
  description?: string
  action: string
  resource: Resource[]
}

// Smth that bounds accesses and accounts
type Permission = {
  id: TId
  // what to do
  role?: Role 
  access: Access //  degenerate case of role?
  
  // who can do
  group: Group
  account: Account // selfgroup? [Account]
  
  validFrom: Date
  validTo: Date
  status: string
}

// Role is a set of accessable actions
type Role = {
  id: TId
  externalId?: string
  description?: string
  accesses: Access[]
}

// Smth that represents audit log
type Event = {
  id: TId
  type: 'role' | 'permission' | 'access' | 'account' | 'resource'
  targetId: TId
  account: Account
  event: string // 'create' | 'update'
}
```

#### API
```ts
const token = 'service-token'
const auth = new Authograph({ token })
const service = new ScopeService({})
const router = someRouter()

router
  .post('/invite/:id', async (req, res) => {
    const token = req.headers.authorization
    const user = await auth.account({ token })
    if (!user) {
      throw new Error('Permission denied')
    }

    const invite = await service.inviteRead(req.params.id)
    const {account, group} = invite
    const {externalId} = user
    if (account !== externalId) {
      throw new Error('Permission denied')
    }

    // adds user to group
    await auth.grant({
      token,
      group,
    })
  })
  .post('/scope/:sid/resource', async (req, res) => {
    const token = req.headers.authorization
    const group = 'scope-' + req.params.sid
    const shared = req.body.shared

    if (!await auth.check({ token, group })) {
      throw new Error('Permission denied')
    }

    const entry = await service.create(req.body)
    const id = 'resource-' + entry.id
    const permissions = [{
      id,
      action: 'read',
      account: '*'  // any authorized
    }, {
      id,
      action: 'preview',
      // unauthorized
    }]
    
    // adds write permission for group
    if (shared) {
      permissions.push({
        id,
        action: 'write',
        group
      })
    // or user
    } else {
      permissions.push({
        id,
        action: 'write',
        token   // attach to userself
      })
    }

    await auth.grant(permissions)

    res.send({ok: true})
  })
  .get('/scope/:sid/resource/:rid', async (req, res) => {
    const id = 'resource-' + req.params.rid
    try {
      const permission = await auth.check({
        id,
        action: 'read',
        token: authorization
      })
      if (!permission) {
        throw new Error('Permission denied')
      }
      res.send(await service.read(req.params.id))
      next()
    } catch (err) {
      next(err)
    }
  })
  .get('/scope/:sid/resource/:rid/preview', async (req, res) => {
    const id = 'resource-' + req.params.id
    const token = req.headers.authorization
    
    try {
      const permission = await auth.check({
        id,
        action: 'preview',
      })
      if (!permission) {
        throw new Error('Permission denied')
      }
      res.send(await service.preview(req.params.id))
      next()
    } catch (err) {
      next(err)
    }
  })
```
</details>

### PBAC
But, [blah-blah-blah](#refs), so PBAC _seems ...more advanced_ than RBAC in 2024. Let's try out.

#### Fundamentals

* Subject (_who_) – user/principal identities
* Object (_what_) – resource to access
* Context (_when_) – conditions required by the user identities to access the resource
* Action (_how_) — way the resource being accessed

#### Contracts

Logic dictates, that `Object` and `Subject` are determined by:
* attributes combination
* direction of action

_Technically_ they are the same thing at this point of reasoning:

```ts
type TId = string
type TEntity = {
  id: TId
  type?:      string // clarifies basic nature: user, service-account
  extenalId:  string // unique by contract: email, phone, ip, service name, domain
  attributes: Record<string, string | number | null>
}
```

Interaction occurs in `Сontext`: time, location, service, product, device, etc. `Context` is associated with a domain. A domain is defined by an interaction model that relies on attributes of bound `Entities` — still exists but dissociated, so it complies DDD. Nice. 
```ts
type TContext = {
  attributes: Record<string, string | number | null>
}
```

Action is an operation on `Object` by `Subject`. Should it have additional props? Is it reusable?
```ts
type TAction = {
  id: TId
  attributes: Record<string, string | number | null>
}
```
Guess, no and no.
```ts
type TAction = string
```

If `Object`, `Subject` and `Context` are bearers of attributes, and `Action` is a standalone value, the rest should be defined as a `Policy`:
```ts
type TPolicy = {
  id: TId
  description?: string
  validFrom: Date
  validTo: Date
  status: string
  action: string[], // array of actions
  resolution: 'allow' | 'deny' | 'notify'
  
  // magic goes here
  condition: {
    syntax: string, // jsonschema expr
    predicate: string
  }
}
```

## Refs
Articles
* [www.cs.purdue.edu/ninghui/pbac_vldbj](https://www.cs.purdue.edu/homes/ninghui/papers/pbac_vldbj.pdf)
* [technologyadvice.com/role-based-access-vs-user-based-access](https://technologyadvice.com/blog/information-technology/role-based-access-vs-user-based-access/)
* [styra.com/what-is-rbac-vs-abac-vs-pbac](https://www.styra.com/blog/what-is-rbac-vs-abac-vs-pbac/)
* [nextlabs.com/pbac-vs-abac](https://www.nextlabs.com/pbac-vs-abac/)
* [axiomatics.com/policy-based-access-control-pbac](https://axiomatics.com/resources/reference-library/policy-based-access-control-pbac)
* [plainid.com/5-myths-about-policy-based-access-control](https://go.plainid.com/5-myths-about-policy-based-access-control)
* [plainid.com/pbac-main-deployment-patterns](https://www.plainid.com/main-deployment-patterns/)
* [symops.com/evolution-access-control-python](https://blog.symops.com/post/evolution-access-control-python)

OSS implementations
* [monken/node-pbac](https://github.com/monken/node-pbac)
* [luowei428/pbac](https://github.com/luowei428/pbac)

Providers
* [casbin.org](https://casbin.org/)
* [plainid.com](https://www.plainid.com/)

## License
[MIT](./LICENSE)
