## @authograph
> Embeddable auth infra made from scratch

### Problem
There's a need to control access to resources:
* for several domains
* granular (abac/rbac)
* with audit / monitoring / alerts
* with gui
* customizable
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
  publicId: string    // email or phone
}

// Smth that describes access
type Grant = {
  id: TId
  description: string
  action: string
  attributes: {
    [key: string]: string
  }
}

// Smth that bounds grants and accounts
type Permission = {
  id: TId
  grant?: Grant
  role?: Role
  account: Account
  validFrom: Date
  validTo: Date
  status: string
}

type Role = {
  id: TId
  description: string
  grants: Grant[]
}

// Smth that represents audit log
type Event = {
  id: TId
  type: 'role' | 'permission' | 'grant' | 'account'
  targetId: TId
  account: Account
  event: string // 'create' | 'update'
}
```

## Refs
* [role-based-access-vs-user-based-access](https://technologyadvice.com/blog/information-technology/role-based-access-vs-user-based-access/)
* [what-is-rbac-vs-abac-vs-pbac](https://www.styra.com/blog/what-is-rbac-vs-abac-vs-pbac/)

## License
[MIT](./LICENSE)
