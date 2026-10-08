#{
# "features": {
#   "buildkit": true
# },
# "registry-mirrors": [
#   "https://mirror.ccs.tencentyun.com",
#   "https://docker.m.daocloud.io"
# ],
# "hosts": [
#   "tcp://0.0.0.0:2375",
#   "unix:///var/run/docker.sock"
# ]
#}

sudo mkdir -p /etc/systemd/system/docker.service.d

sudo tee /etc/systemd/system/docker.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://127.0.0.1:2375
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker