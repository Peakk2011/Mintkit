export const pipe=function(){const a=arguments;return function(x){let i=0;for(;i<a.length;)x=a[i++](x);return x}};
export const compose=function(){const a=arguments;return function(x){let i=a.length-1;for(;i>=0;)x=a[i--](x);return x}};
export function createState(v){
    let s=v,c=[];
    return{
        get:function(){return s},
        set:function(n){
            s=typeof n==="function"?n(s):n;
            for(let i=0,l=c.length;i<l;)c[i++](s)
        },
        subscribe:function(f){
            typeof f==="function"?c[c.length]=f:0
        }
    }
}
export function generateCSS(){return ''}
