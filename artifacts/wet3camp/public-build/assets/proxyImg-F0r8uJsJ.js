function i(t,e=640){if(t)return t.startsWith("http://")||t.startsWith("https://")?`/api/image-proxy?url=${encodeURIComponent(t)}&w=${e}`:t}export{i as p};
