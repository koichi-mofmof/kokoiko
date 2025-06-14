"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function ExampleSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-neutral-50 to-neutral-100 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="lg:text-center mb-16"
        >
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
            使用例
          </h2>
          <p className="mt-2 text-2xl sm:text-4xl leading-8 font-bold text-neutral-900">
            こんな使い方ができます
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/5911145/pexels-photo-5911145.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="カップル"
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                カップルで
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                「今度のデートはどこに行こう？」を解決。お互いが興味のある場所をリストアップして、週末の予定を立てやすくなります。
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/1267697/pexels-photo-1267697.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="友人グループ"
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                友人グループで
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                旅行計画やお出かけ先の候補を共有。「あのとき誰かが言ってた場所どこだっけ？」がなくなります。
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 transform border border-neutral-200"
          >
            <div className="h-60 bg-primary-100 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <Image
                  src="https://images.pexels.com/photos/3935702/pexels-photo-3935702.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="個人利用"
                  fill
                  style={{ objectFit: "cover" }}
                  className="opacity-80 hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            <div className="p-8">
              <h3 className="font-semibold text-xl mb-3 text-neutral-900">
                一人でも
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                SNSで見つけた気になるスポットや、あとで行きたいお店を整理。自分だけの行きたい場所コレクションを作れます。
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
