## @authograph
> Embeddable auth infra made from scratch

### Challenge
There's a need to control access to resources:
* for several domains
* granular (abac/rbac)
* with audit / monitoring / alerts
* with gui
* customizable and flexible
* with ttl
* with delegation
* with revocation
* fast (10k+ rps)

Stack: linux + nodejs + pg

### Entities

```ts
type TId = string

// Smth that represents an actor — user or service
type Account = {
  id: TId
  type: 'user' | 'service'
  externalId: string // unique by design: ip, email or phone or service name
}

type Group = {
  id: TId
  owner: Account
  externalId: string // unique by contract
  accounts: Account[]
}

// Smth that represents an accessable (abstract) entity
type Resource = {
  id: TId
  owner: Account
  externalId: string // unique by contract
  // attributes: {
  //   [key: string]: string
  // }
}

// Smth that allows the specified operation on resource(s)
type Access = {
  id: TId
  description: string
  action: string
  resource: Resource[]
}

// Smth that bounds accesses and accounts
type Permission = {
  id: TId
  access?: Access
  role?: Role
  account: Account
  validFrom: Date
  validTo: Date
  status: string
}

// Role is a set of accessable actions
type Role = {
  id: TId
  description: string
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

### API
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

## Refs
* [role-based-access-vs-user-based-access](https://technologyadvice.com/blog/information-technology/role-based-access-vs-user-based-access/)
* [what-is-rbac-vs-abac-vs-pbac](https://www.styra.com/blog/what-is-rbac-vs-abac-vs-pbac/)

## License
[MIT](./LICENSE)
