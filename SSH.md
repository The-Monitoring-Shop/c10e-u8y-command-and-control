# SSH Access

Via SSH, you can perform the script commands under [SETUP](SETUP.md) `Collector & Exporter` & below `Lab` sections.

Initially, you will need to configure your machine to access GCP via the GCloud CLI package - see `GCloud | CLI` section in [SETUP](SETUP.md).

## Connecting

You can then SSH to the VM instance;

`gcloud compute ssh university --tunnel-through-iap`

NB: Daily, you will need to re-login to gcloud.

`gcloud auth login`

## Initial user config

After your initial login, run the `/opt/shared_config/setupUser.sh` script to setup your user account on the VM.

## Locations

Under `/opt` the following locations exist;

- `containerd` is a system location and should not be touched

- `git` is where the c10e u8y Git repositories are stored locally

- `google-cloud-sdk` is where the GCloud CLI binaries are stored

- `shared_config` is where any shared config for initial setup is stored

## Other commands

The below section(s) are covered via the `/opt/shared_config/setupUser.sh` script on the GCP VM, and provided here for completness.

To obtain k8s cluster credentials, for kubcetl;

`gcloud container clusters get-credentials university`

---

# Labs

## Deploy

Run: `./lab-deploy.sh <lab name>`

```bash
lab="c10e-essentials-1"
kubectl create namespace $lab
helm install $lab ./helm_charts/lab-gen-initial-build --values ./lab_gen_values/initial-values.yaml --namespace $lab
```

## Update

```bash
lab="c10e-essentials-1"
helm upgrade $lab ./helm_charts/lab-gen-initial-build --values ./lab_gen_values/initial-values.yaml --namespace $lab
```

## Remove

Run: `./lab-destroy.sh <lab name>`

```bash
lab="c10e-essentials-1"
helm uninstall $lab --namespace $lab
kubectl delete namespace $lab
```

## Port Forwarding

Run: `./lab-portforward.sh <lab name>`

```bash
lab="c10e-essentials-1"
kubectl port-forward svc/${lab}-frontendproxy 8080:8080 -namespace $lab

kubectl port-forward svc/${lab}-prometheus-server 9090 --namespace $lab

kubectl port-forward svc/prometheus-node-exporter 9100 --namespace collectors
```

## Use Cases

Run: `./lab-usecase.sh <lab name> start|stop <caseid>`

```bash
lab="c10e-essentials-1"

helm upgrade -f ./lab_gen_values/case0001-deploy.yaml $lab ./helm_charts/lab-gen-initial-build --reuse-values --namespace $lab

helm upgrade -f ./lab_gen_values/case0001-rollback.yaml $lab ./helm_charts/lab-gen-initial-build --reuse-values --namespace $lab
```

## List Values

```bash
lab="c10e-essentials-1"
helm get values $lab -a --namespace $lab
```
