# Setup steps

### Add Repo
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
```

### Install Contour
```bash
helm install my-release bitnami/contour --namespace projectcontour --create-namespace
```

### verify
```bash
kubectl -n projectcontour get po,svc
```


** Please be patient while the chart is being deployed **
1. Get Contours's load balancer IP/hostname:

     NOTE: It may take a few minutes for this to become available.

     You can watch the status by running:

         $ kubectl get svc my-release-contour-envoy --namespace projectcontour -w

     Once 'EXTERNAL-IP' is no longer '<pending>':

         $ kubectl describe svc my-release-contour-envoy --namespace projectcontour | grep Ingress | awk '{print $3}'

2. Configure DNS records corresponding to Kubernetes ingress resources to point to the load balancer IP/hostname found in step 1

WARNING: There are "resources" sections in the chart not set. Using "resourcesPreset" is not recommended for production. For production installations, please set the following values according to your workload needs:
  - contour.resources
  - envoy.resources
  - envoy.shutdownManager.resources
+info https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/