# Setup

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

---

## GCloud

### IAM

For Compute Engine VM to Manage k8s Cluster

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

> These are available in `Kubernetes Engine Service Agent`, but that role has some 1500+ other perms which are not required

3. Add roles/logging.viewer
4. Assign the custom role to the service account used by the VM instance

### CLI

To setup SSH access from your own machine, you must first setup the GCloud CLI.

Install;

- <https://cloud.google.com/sdk/docs/install>

Set Defaults, if not set as part of init;

- <https://cloud.google.com/compute/docs/gcloud-compute#set_default_zone_and_region_in_your_local_client>
- `gcloud config set compute/region us-central1`
- `gcloud config set compute/zone us-central1-a`
