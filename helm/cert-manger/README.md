# Setup steps

### Add Repo
```bash
helm repo add jetstack https://charts.jetstack.io
```

### install Cert Manager
```bash
helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true
```

### Verify
```bash
kubectl get pods -n cert-manager
```