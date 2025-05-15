# Setup steps

### Ref  
- https://developer.hashicorp.com/vault/docs/platform/k8s/helm/run#architecture

### Add Repo
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
```

### Search Repo
```bash
helm search repo hashicorp/vault
```

### Dry run before install
```bash
helm install --dry-run vault hashicorp/vault
```

### Install
```bash
helm install vault hashicorp/vault --namespace vault --create-namespace
```
### Checking installed
```bash
helm list -n vault
helm status vault -n vault
helm get manifest vault -n vault
kubectl get pods -n vault
```


### Initialize and unseal Vault  
Seal/Unseal - https://developer.hashicorp.com/vault/docs/concepts/seal#why  

```bash
kubectl exec -n vault -it vault-0 -- vault operator init
```  
copy output text to some note.

```bash
kubectl exec -n vault -it vault-0 -- vault operator unseal <Unseal Key 1>
kubectl exec -n vault -it vault-0 -- vault operator unseal <Unseal Key 2>
kubectl exec -n vault -it vault-0 -- vault operator unseal <Unseal Key 3>
```
## Uninstall  
```bash
helm uninstall -n vault vault
kubectl delete namespace vault
```

### Document for production  
- https://developer.hashicorp.com/vault/docs/platform/k8s/helm/configuration  
- https://developer.hashicorp.com/vault/docs/platform/k8s/helm/run#architecture

# Setup Secret

## Shell to vault-0 pod
```bash
kubectl exec -n vault -it vault-0 -- /bin/sh
```

## Login
```bash
vault login
```
Use Root Token for command prompt  


## Enable kv-v2 secrets at the path  

- usage: vault secrets enable [options] TYPE
- -path=\<string\>
      Place where the secrets engine will be accessible. This must be unique
      cross all secrets engines. This defaults to the "type" of the secrets
      engine
- TYPE
```bash
vault secrets enable -path=internal kv-v2
```

### Create Secret
```bash
vault kv put internal/database/config username="db-readonly-username" password="db-secret-password"
```

### Get Secret
```bash
vault kv get internal/database/config
```
