/**
 * MIT License
 *
 * Copyright (c) 2017 Draining Sun
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict"

const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

const benchmark = require("benchmark")
const beautifyBenchmark = require("beautify-benchmark")

const farmhash = require("farmhash")
const murmurhashNative = require("murmurhash-native")
const xxhash = require("xxhash")
const wasm = require("hash-wasm")

for (let i = 5; i <= 17; i+=3) {
    const buffer = crypto.randomBytes(Math.pow(2, i))

    const suite = new benchmark.Suite()

    suite.add("md5", () => {
        crypto
            .createHash("md5")
            .update(buffer)
            .digest("hex")
    })

    suite.add("sha1", () => {
        crypto
            .createHash("sha1")
            .update(buffer)
            .digest("hex")
    })

    suite.add("farmHash64", () => {
        farmhash.hash64(buffer)
    })

    suite.add("murmurHash64", () => {
        murmurhashNative.murmurHash64(buffer)
    })

    suite.add("murmurHash128", () => {
        murmurhashNative.murmurHash128(buffer)
    })

    suite.add("xxHash32", () => {
        xxhash.hash(buffer, 0xCAFEBABE, "hex")
    })

    suite.add("xxHash64", () => {
        xxhash.hash64(buffer, 0xCAFEBABE, "hex")
    })

    // suite.add("Wasm-XXhash64", () => {
    //     return wasm.xxhash64(buffer)
    // })

    // suite.add("Wasm-XXhash128", () => {
    //     return wasm.xxhash128(buffer)
    // })

    // suite.add("Wasm-XXhash3", () => {
    //     return wasm.xxhash3(buffer)
    // })

    suite
        .on("start", () => {
            console.log(`${buffer.length} bytes`)
        })
        .on("cycle", (event) => {
            beautifyBenchmark.add(event.target)
        })
        .on("complete", () => {
            beautifyBenchmark.log()

            console.log("Fastest is: " + suite.filter("fastest")[0].name)
            console.log("Slowest is: " + suite.filter("slowest")[0].name)
        })
        .run({async: false})
}
