# c10e-u8y-command-and-control

Chronosphere (c10e) Command & Control for University (u8y) lab generation.

## Collector & Exporter

### Deploy

Run: `./collectors-deploy.sh`

```bash
kubectl create namespace collectors
kubectl apply -f ./c10e_col_conf/chronocollector.yaml --namespace collectors
helm install prometheus-node-exporter ./helm_charts/lab-gen-initial-build/charts/prometheus \
 --values ./lab_gen_values/initial-values.yaml \
 --set prometheus-node-exporter.enabled=true \
 --set alertmanager.enabled=false \
 --set kube-state-metrics.enabled=false \
 --set prometheus-pushgateway.enabled=false \
 --namespace collectors
```

### Remove

Run: `./collectors-destroy.sh`

```bash
kubectl delete -f ./c10e_col_conf/chronocollector.yaml --namespace collectors
helm uninstall prometheus-node-exporter --namespace collectors
kubectl delete namespace collectors
```

## Lab

### Deploy

Run: `./lab-deploy.sh <lab name>`

```bash
lab="c10e-essentials-1"
kubectl create namespace $lab
helm install $lab ./helm_charts/lab-gen-initial-build --values ./lab_gen_values/initial-values.yaml --namespace $lab
```

### Remove

Run: `./lab-destroy.sh <lab name>`

```bash
lab="c10e-essentials-1"
helm uninstall $lab --namespace $lab
kubectl delete namespace $lab
```

### Port Forwarding

Run: `./lab-portforward.sh <lab name>`

```bash
lab="c10e-essentials-1"
kubectl port-forward svc/${lab}-frontendproxy 8080:8080 -namespace $lab

kubectl port-forward svc/${lab}-prometheus-server 9090 --namespace $lab

kubectl port-forward svc/prometheus-node-exporter 9100 --namespace collectors
```

### Update

```bash
lab="c10e-essentials-1"
helm upgrade $lab ./helm_charts/lab-gen-initial-build --values ./lab_gen_values/initial-values.yaml --namespace $lab
```

### Use Cases

Run: `./lab-usecase.sh <lab name> start|stop <caseid>`

```bash
lab="c10e-essentials-1"
helm upgrade -f ./lab_gen_values/case0001-deploy.yaml $lab ./helm_charts/lab-gen-initial-build --reuse-values --namespace $lab
helm upgrade -f ./lab_gen_values/case0001-rollback.yaml $lab ./helm_charts/lab-gen-initial-build --reuse-values --namespace $lab
```

### List values

```bash
lab="c10e-essentials-1"
helm get values $lab -a --namespace $lab
```

---

## For Compute Engine VM to manage k8s cluster

The following IAM access needs assigning to Compute Engine Service Account

1. Create a custom copy of `Kubernetes Engine Developer`
2. Assign following additional permissions

```
container.clusterRoleBindings.create
container.clusterRoleBindings.delete
container.clusterRoleBindings.update
container.clusterRoles.bind
container.clusterRoles.create
container.clusterRoles.delete
container.clusterRoles.escalate
container.clusterRoles.update

container.roleBindings.create
container.roleBindings.delete
container.roleBindings.update
container.roles.bind
container.roles.create
container.roles.delete
container.roles.escalate
container.roles.update
```

> These are availabe in `Kubernetes Engine Service Agent`, but that role has some 1500+ other perms which are not required

3. Add roles/logging.viewer
4. Assign the custom role to the `<account>-compute@developer.gserviceaccount.com` account
