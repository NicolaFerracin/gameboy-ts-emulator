## Info

https://gekkio.fi/files/gb-docs/gbctr.pdf

## Notes

- there is no native u8int or u16int in TS, so we use custom types around `number` to indicate the desired bit size
- the F register has its 4 lower bits always set to 0, it's a small quirk we need to account for when masking values in the setter
