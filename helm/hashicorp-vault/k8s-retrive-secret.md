### Configure Kubernetes authentication
```bash
kubectl exec -n vault -it vault-0 -- /bin/sh
```

Enable the Kubernetes authentication method. 

```bash
vault auth enable kubernetes
```

Configure the Kubernetes authentication method to use the location of the Kubernetes API. 
```bash
vault write auth/kubernetes/config kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443"
```

Write Policy
```bash
vault policy write internal-app - <<EOF
path "internal/data/database/config" {
   capabilities = ["read"]
}
EOF
```

Create a Kubernetes authentication role
```bash
vault write auth/kubernetes/role/internal-app \
      bound_service_account_names=internal-app \
      bound_service_account_namespaces=thaitype-demo-corp \
      policies=internal-app \
      ttl=24h
```

### Define a Kubernetes service account

```bash
kubectl get serviceaccounts -n thaitype-demo-corp
```

```bash
kubectl create sa internal-app -n thaitype-demo-corp
```

```bash
kubectl get serviceaccounts -n thaitype-demo-corp
```
