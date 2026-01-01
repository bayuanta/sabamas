'use client'

import React from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Autoplay, Pagination } from 'swiper/modules';

export default function Home() {


  return (
    <>
      <div className="page-wrapper">
        <header className="main-header-two clearfix">
          <div className="main-header-two__top">
            <div className="container">
              <div className="main-header-two__top-inner">
                <div className="main-header-two__top-address">
                  <ul className="list-unstyled main-header-two__top-address-list">
                    <li>
                      <div className="icon">
                        <span className="fa fa-map-marker-alt"></span>
                      </div>
                      <div className="text">
                        <p>Kemasan, Sawit, Boyolali, Jawa Tengah</p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <span className="fa fa-envelope"></span>
                      </div>
                      <div className="text">
                        <p><a href="mailto:sabamaskemasan@gmail.com">sabamaskemasan@gmail.com</a></p>
                      </div>
                    </li>
                    <li>
                      <div className="icon">
                        <span className="fa fa-clock"></span>
                      </div>
                      <div className="text">
                        <p>Senin - Sabtu 09.00 - 17.00</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div className="main-header-two__top-social">
                  <a href="/login" style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa fa-user-shield"></i> Login Admin
                  </a>
                </div>
              </div>
            </div>
          </div>
          <nav className="main-menu main-menu-two clearfix">
            <div className="main-menu-two__wrapper clearfix">
              <div className="container">
                <div className="main-menu-two__wrapper-inner clearfix">
                  <div className="main-menu-two__left">
                    <div className="main-menu-two__logo">
                      <a href="index.html">
                        {/* Replace with actual Logo if available, or text for now */}
                        <h2 style={{ color: 'white', fontWeight: 'bold', margin: 0 }}>SABAMAS</h2>
                        {/* <img src="/assets/images/resources/logo-1.png" alt="" /> */}
                      </a>
                    </div>
                    <div className="main-menu-two__main-menu-box">
                      <a href="#" className="mobile-nav__toggler"><i className="fa fa-bars"></i></a>
                      <ul className="main-menu__list one-page-scroll-menu">
                        <li className="scrollToLink current">
                          <a href="#home">Beranda</a>
                        </li>
                        <li className="scrollToLink">
                          <a href="#about">Tentang Kami</a>
                        </li>
                        <li className="scrollToLink">
                          <a href="#services">Layanan</a>
                        </li>
                        <li className="scrollToLink">
                          <a href="#portfolio">Galeri</a>
                        </li>
                        <li className="scrollToLink">
                          <a href="#pricing">Tarif</a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="main-menu-two__right">
                    <div className="main-menu-two__search-call">
                      <div className="main-menu-two__search-box">
                        <a href="/portal-login" className="thm-btn" style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '5px' }}>
                          Cek Tagihan
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </header>

        <div className="stricky-header stricked-menu main-menu main-menu-two">
          <div className="sticky-header__content"></div>
          {/* /.sticky-header__content */}
        </div>
        {/* /.stricky-header */}

        {/* Main Slider Start */}
        <section className="main-slider-two clearfix" id="home">
          <div className="swiper-container thm-swiper__slider" data-swiper-options='{"slidesPerView": 1, "loop": true,
                "effect": "fade",
                "pagination": {
                "el": "#main-slider-pagination",
                "type": "bullets",
                "clickable": true
                },
                "navigation": {
                "nextEl": "#main-slider__swiper-button-next",
                "prevEl": "#main-slider__swiper-button-prev"
                },
                "autoplay": {
                "delay": 5000
                }}'>
            <div className="swiper-wrapper">

              <div className="swiper-slide">
                <div className="main-slider-two-bg-box">
                  <div className="main-slider-two-image-layer"
                    style={{ backgroundImage: 'url(/assets/images/backgrounds/main-slider-2-1.jpg)' }}></div>

                  <div className="main-slider-two-shape-box">
                    <div className="main-slider-two-shape-1"
                      style={{ backgroundImage: 'url(/assets/images/shapes/main-slider-two-shape-1.png)' }}>
                    </div>
                    <div className="main-slider-two-shape-2 float-bob-x">
                      <img src="/assets/images/shapes/main-slider-two-shape-2.png" alt="" />
                    </div>
                    {/* Bubbles */}
                    <div className="main-slider-two-bubble-1 float-bob-x" style={{ bottom: '150px' }}>
                      <img src="/assets/images/shapes/main-slider-two-bubble-1.png" alt="" />
                    </div>
                    {/* ... more bubbles can be added if crucial, keeping clean for now */}
                  </div>
                </div>

                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider-two__content" style={{ position: 'relative', top: '-50px' }}>
                        <p className="main-slider-two__sub-title">Solusi Sampah Terbaik</p>
                        <h2 className="main-slider-two__title">Layanan Kebersihan <br /> & Pengelolaan Sampah</h2>
                        <p className="main-slider-two__text">Kami membantu mengelola sampah rumah tangga dan industri <br />
                          dengan sistem digital yang transparan dan efisien.</p>
                        <div className="main-slider-two__btn-box">
                          <a href="#about" className="thm-btn main-slider-two__btn">Pelajari Selengkapnya <i
                            className="fa fa-angle-right"></i></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="swiper-slide">
                <div className="main-slider-two-bg-box">
                  <div className="main-slider-two-image-layer"
                    style={{ backgroundImage: 'url(/assets/images/backgrounds/main-slider-2-2.jpg)' }}></div>
                  <div className="main-slider-two-shape-box">
                    <div className="main-slider-two-shape-1"
                      style={{ backgroundImage: 'url(/assets/images/shapes/main-slider-two-shape-1.png)' }}>
                    </div>
                    <div className="main-slider-two-shape-2 float-bob-x">
                      <img src="/assets/images/shapes/main-slider-two-shape-2.png" alt="" />
                    </div>
                    <div className="main-slider-two-shape-bubble-1 float-bob-x" style={{ bottom: '150px' }}>
                      <img src="/assets/images/shapes/main-slider-two-bubble-1.png" alt="" />
                    </div>
                  </div>
                </div>
                <div className="container">
                  <div className="row">
                    <div className="col-xl-12">
                      <div className="main-slider-two__content" style={{ position: 'relative', top: '-50px' }}>
                        <p className="main-slider-two__sub-title">Lingkungan Bersih, Hidup Sehat</p>
                        <h2 className="main-slider-two__title">Profesional & <br /> Terpercaya</h2>
                        <p className="main-slider-two__text">Dukung gerakan go-green dengan manajemen sampah yang <br />
                          bertanggung jawab bersama SABAMAS.</p>
                        <div className="main-slider-two__btn-box">
                          <a href="#services" className="thm-btn main-slider-two__btn">Lihat Layanan <i
                            className="fa fa-angle-right"></i></a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Navigation if needed */}

          </div>
        </section>
        {/* Main Slider End */}

        {/* Feature Two Start */}
        <section className="feature-two">
          <div className="container">
            <div className="row">
              {/* Feature Two Single Start */}
              <div className="col-xl-4 wow fadeInLeft" data-wow-delay="100ms">
                <div className="feature-two__single">
                  <div className="feature-two__icon">
                    <img src="/assets/images/icon/feature-one-icon-1.png" alt="" />
                  </div>
                  <div className="feature-two__content">
                    <h3 className="feature-two__title"><a href="#services">Jemput Sampah</a></h3>
                    <p className="feature-two__text">Layanan penjemputan sampah rutin terjadwal ke lokasi Anda.</p>
                  </div>
                  {/* Stars decorations */}
                </div>
              </div>
              {/* Feature Two Single End */}
              {/* Feature Two Single Start */}
              <div className="col-xl-4 wow fadeInLeft" data-wow-delay="200ms">
                <div className="feature-two__single">
                  <div className="feature-two__icon">
                    <img src="/assets/images/icon/feature-one-icon-2.png" alt="" />
                  </div>
                  <div className="feature-two__content">
                    <h3 className="feature-two__title"><a href="#services">Bank Sampah</a></h3>
                    <p className="feature-two__text">Ubah sampah menjadi berkah dengan menabung di Bank Sampah.</p>
                  </div>
                </div>
              </div>
              {/* Feature Two Single End */}
              {/* Feature Two Single Start */}
              <div className="col-xl-4 wow fadeInLeft" data-wow-delay="300ms">
                <div className="feature-two__single">
                  <div className="feature-two__icon">
                    <img src="/assets/images/icon/feature-one-icon-3.png" alt="" />
                  </div>
                  <div className="feature-two__content">
                    <h3 className="feature-two__title"><a href="#services">Pengolahan Limbah</a></h3>
                    <p className="feature-two__text">Pengelolaan limbah profesional untuk industri dan bisnis.</p>
                  </div>
                </div>
              </div>
              {/* Feature Two Single End */}
            </div>
          </div>
        </section>
        {/* Feature Two End */}

        {/* We Cleaning Start (About) */}
        <section className="we-cleaning" id="about">
          <div className="container">
            <div className="row">
              <div className="col-xl-6">
                <div className="we-cleaning__left">
                  <div className="we-cleaning__img-box wow slideInLeft" data-wow-delay="100ms"
                    data-wow-duration="2500ms">
                    <div className="we-cleaning__img">
                      <img src="/assets/images/resources/we-cleaning-img-1.jpg" alt="" />
                    </div>
                    <div className="we-cleaning-line">
                      <img src="/assets/images/shapes/we-cleaning-line.png" alt="" />
                    </div>
                    <div className="we-cleaning__small-img">
                      <img src="/assets/images/resources/we-cleaning-small-img.jpg" alt="" />
                    </div>
                    {/* Video Link can be kept or removed */}
                    <div className="we-cleaning__shape-1"></div>
                    <div className="we-cleaning__shape-2"></div>
                    <div className="we-cleaning__shape-3"></div>
                    <div className="we-cleaning__shape-4"></div>
                    <div className="we-cleaning__shape-5"></div>
                  </div>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="we-cleaning__right">
                  <div className="section-title text-left">
                    <span className="section-title__tagline">Tentang SABAMAS</span>
                    <h2 className="section-title__title">Solusi Kebersihan Sejak 2021</h2>
                  </div>
                  <p className="we-cleaning__text-1">SABAMAS adalah unit usaha BUMDES KALEM yang berfokus pada digitalisasi pengelolaan sampah. Kami hadir untuk menciptakan lingkungan yang lebih bersih dan sehat melalui sistem yang terintegrasi.</p>
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (min-width: 768px) {
                      .we-cleaning-points-responsive {
                        display: flex;
                        flex-wrap: nowrap;
                        gap: 15px;
                      }
                      .we-cleaning-item-responsive {
                        width: 50%;
                        max-width: none;
                        float: none;
                        display: block;
                      }
                    }
                    @media (max-width: 767px) {
                      .we-cleaning-points-responsive {
                        display: block;
                      }
                      .we-cleaning-item-responsive {
                        width: 100%;
                        margin-bottom: 30px;
                      }
                      .we-cleaning-item-responsive:last-child {
                        margin-left: 0 !important; 
                      }
                      .we-cleaning__icon {
                        margin-left: 0 !important;
                      }
                    }
                  `}} />
                  <div className="we-cleaning__points-box">
                    <ul className="list-unstyled we-cleaning__points clearfix we-cleaning-points-responsive">
                      <li className="we-cleaning-item-responsive">
                        <div className="we-cleaning__icon" style={{ marginLeft: '0px' }}>
                          <span className="icon-house-cleaning"></span>
                        </div>
                        <div className="we-cleaning__text-box">
                          <h4 className="we-cleaning__title">Layanan <br /> Rumah Tangga</h4>
                          <p className="we-cleaning__text-2">Solusi praktis untuk kebersihan <br /> lingkungan hunian Anda.</p>
                        </div>
                      </li>
                      <li className="we-cleaning-item-responsive">
                        <div className="we-cleaning__icon" style={{ marginLeft: '0px' }}>
                          <span className="icon-buildings"></span>
                        </div>
                        <div className="we-cleaning__text-box">
                          <h4 className="we-cleaning__title">Layanan <br /> Komersial</h4>
                          <p className="we-cleaning__text-2">Partner terpercaya untuk <br /> kebersihan tempat usaha dan industri.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <a href="#services" className="thm-btn we-cleaning__btn">Lihat Layanan <i
                    className="fa fa-angle-right"></i></a>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* We Cleaning End */}

        {/* Services Two Start */}
        <section className="services-two" id="services" style={{ paddingBottom: '50px' }}>
          <div className="services-two-bubble float-bob-x"
            style={{ backgroundImage: 'url(/assets/images/shapes/services-two-bubble.png)' }}></div>
          <div className="services-two-dot-1 float-bob-y">
            <img src="/assets/images/shapes/services-two-dot-1.png" alt="" />
          </div>
          <div className="services-two-dot-2 float-bob-y">
            <img src="/assets/images/shapes/services-two-dot-2.png" alt="" />
          </div>
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Layanan Kami</span>
              <h2 className="section-title__title">Memberikan Layanan Terbaik <br /> Untuk Pelanggan</h2>
            </div>
            <div className="row">
              {/* Services Two single Start */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms">
                <div className="services-two__single">
                  <div className="services-two__img-box">
                    <div className="services-two__img">
                      <img src="/assets/images/services/services-2-1.jpg" alt="" />
                    </div>
                    <div className="services-two__icon">
                      {/* <span className="icon-plumbing"></span> */}
                      <img src="/assets/images/icon/icon-retribusi.png" alt="Retribusi Sampah" style={{ width: '60px', height: 'auto', position: 'relative', zIndex: 2 }} />
                    </div>
                  </div>
                  <div className="services-two__content">
                    <h3 className="services-two__title"><a href="#">Retribusi Sampah</a>
                    </h3>
                    <p className="services-two__text">Layanan pengambilan sampah rutin dengan tarif terjangkau dan jadwal pasti.</p>
                    <a href="#" className="services-two__btn">Baca Selengkapnya</a>
                  </div>
                </div>
              </div>
              {/* Services Two single End */}
              {/* Services Two single Start */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms">
                <div className="services-two__single">
                  <div className="services-two__img-box">
                    <div className="services-two__img">
                      <img src="/assets/images/services/services-2-2.jpg" alt="" />
                    </div>
                    <div className="services-two__icon">
                      {/* Icon change if possible, using available classes */}
                      {/* <span className="icon-laundry"></span> */}
                      <img src="/assets/images/icon/icon-banksampah.png" alt="Bank Sampah" style={{ width: '60px', height: 'auto', position: 'relative', zIndex: 2 }} />
                    </div>
                  </div>
                  <div className="services-two__content">
                    <h3 className="services-two__title"><a href="#">Bank Sampah</a>
                    </h3>
                    <p className="services-two__text">Tukarkan sampah terpilah Anda menjadi saldo tabungan yang bernilai ekonomis.</p>
                    <a href="#" className="services-two__btn">Baca Selengkapnya</a>
                  </div>
                </div>
              </div>
              {/* Services Two single End */}
              {/* Services Two single Start */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="300ms">
                <div className="services-two__single">
                  <div className="services-two__img-box">
                    <div className="services-two__img">
                      <img src="/assets/images/services/services-2-3.jpg" alt="" />
                    </div>
                    <div className="services-two__icon">
                      {/* <span className="icon-washing-plate"></span> */}
                      <img src="/assets/images/icon/icon-rosok.png" alt="Jual Rosok" style={{ width: '60px', height: 'auto', position: 'relative', zIndex: 2 }} />
                    </div>
                  </div>
                  <div className="services-two__content">
                    <h3 className="services-two__title"><a href="#">Jual Rosok</a>
                    </h3>
                    <p className="services-two__text">Layanan jemput barang bekas (rosok) dengan harga bersaing dan timbangan akurat.</p>
                    <a href="#" className="services-two__btn">Baca Selengkapnya</a>
                  </div>
                </div>
              </div>
              {/* Services Two single End */}
            </div>
          </div>
        </section>
        {/* Services Two End */}

        {/* Services Two End */}

        {/* Project One Start */}
        <section className="project-one" id="portfolio" style={{ paddingTop: '50px', paddingBottom: '30px' }}>
          <div className="project-one__top">
            <div className="container">
              <div className="row">
                <div className="col-xl-6 col-lg-6">
                  <div className="section-title text-left">
                    <span className="section-title__tagline">Galeri Kegiatan</span>
                    <h2 className="section-title__title" style={{ fontSize: '36px' }}>Dokumentasi Operasional <br /> Layanan Kami</h2>
                  </div>
                </div>
                <div className="col-xl-6 col-lg-6">
                  <div className="project-one__top-text text-left" style={{ marginTop: '35px' }}>
                    <p className="project-one__text" style={{ fontSize: '16px', lineHeight: '28px', color: 'var(--brote-gray)' }}>
                      Kami selalu mendokumentasikan setiap aktivitas pengangkutan dan pengelolaan sampah sebagai bentuk transparansi dan komitmen layanan kami kepada pelanggan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="project-one__bottom">
            <div className="project-one__bottom-container">
              <div className="project-one__carousel">
                <style>
                  {`
                    .swiper-pagination-bullet {
                      width: 12px;
                      height: 12px;
                      background-color: var(--brote-gray);
                      opacity: 0.5;
                      transition: all 0.3s ease;
                    }
                    .swiper-pagination-bullet-active {
                      width: 18px;
                      height: 18px;
                      background-color: var(--brote-primary);
                      opacity: 1;
                    }
                  `}
                </style>
                <Swiper
                  modules={[Autoplay, Pagination]}
                  pagination={{ clickable: true }}
                  spaceBetween={30}
                  slidesPerView={4}
                  loop={true}
                  autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                  }}
                  breakpoints={{
                    0: {
                      slidesPerView: 1,
                    },
                    768: {
                      slidesPerView: 2,
                    },
                    992: {
                      slidesPerView: 3,
                    },
                    1200: {
                      slidesPerView: 4,
                    },
                  }}
                  className="mySwiper"
                  style={{ paddingBottom: '50px' }}
                >
                  <SwiperSlide>
                    <div className="project-one__single">
                      <div className="project-one__img">
                        <img src="/assets/images/project/project-1-1.jpg" alt="" />
                      </div>
                      <div className="project-one__content">
                        <p className="project-one__sub-title">Pengangkutan</p>
                        <h3 className="project-one__title"><a href="#">Area Perumahan</a></h3>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="project-one__single">
                      <div className="project-one__img">
                        <img src="/assets/images/project/project-1-2.jpg" alt="" />
                      </div>
                      <div className="project-one__content">
                        <p className="project-one__sub-title">Pemilahan</p>
                        <h3 className="project-one__title"><a href="#">Bank Sampah</a></h3>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="project-one__single">
                      <div className="project-one__img">
                        <img src="/assets/images/project/project-1-3.jpg" alt="" />
                      </div>
                      <div className="project-one__content">
                        <p className="project-one__sub-title">Layanan</p>
                        <h3 className="project-one__title"><a href="#">Kebersihan Kota</a></h3>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="project-one__single">
                      <div className="project-one__img">
                        <img src="/assets/images/project/project-1-4.jpg" alt="" />
                      </div>
                      <div className="project-one__content">
                        <p className="project-one__sub-title">Edukasi</p>
                        <h3 className="project-one__title"><a href="#">Sosialisasi Warga</a></h3>
                      </div>
                    </div>
                  </SwiperSlide>
                  <SwiperSlide>
                    <div className="project-one__single">
                      <div className="project-one__img">
                        <img src="/assets/images/project/project-1-1.jpg" alt="" />
                      </div>
                      <div className="project-one__content">
                        <p className="project-one__sub-title">Pengangkutan</p>
                        <h3 className="project-one__title"><a href="#">Area Komersial</a></h3>
                      </div>
                    </div>
                  </SwiperSlide>
                </Swiper>
              </div>
            </div>
          </div>

        </section >
        {/* Project One End */}

        {/* Pricing Section Start */}
        <section className="services-three" id="pricing" style={{ padding: '60px 0 90px' }}>
          <div className="services-three-bg" style={{ backgroundImage: 'url(/assets/images/shapes/services-three-bg.png)' }}></div>
          <div className="services-three-dot-1">
            <img src="/assets/images/shapes/services-three-dot-1.png" alt="" className="float-bob-x" />
          </div>
          <div className="services-three-dot-2">
            <img src="/assets/images/shapes/services-three-dot-2.png" alt="" className="float-bob-y" />
          </div>
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">Paket Harga</span>
              <h2 className="section-title__title">Tarif Layanan Pengangkutan <br /> Sampah Bulanan</h2>
            </div>
            <div className="row">
              {/* Pricing Item 1 */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="100ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 10px 40px 0px rgba(0,0,0,0.05)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 500ms ease' }}>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Rumah Tangga</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Sampah Dipilah</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>Rp 25.000 <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>/ Bulan</span></h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Pengangkutan 2x Seminggu</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Sampah Terpilah</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Layanan Kebersihan</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20berlangganan%20paket%20Rumah%20Tangga%20(Sampah%20Dipilah)%20seharga%20Rp%2025.000/bulan." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Pilih Paket</a>
                  </div>
                </div>
              </div>
              {/* Pricing Item 2 - Best Seller */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="200ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 20px 50px 0px rgba(0,0,0,0.1)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transform: 'scale(1.02)', border: '2px solid var(--brote-primary)', zIndex: 2 }}>
                  <div style={{ position: 'absolute', top: '0', right: '0', background: 'var(--brote-primary)', color: '#fff', padding: '5px 20px', borderRadius: '0 0 0 15px', fontSize: '13px', fontWeight: 'bold' }}>Paling Laris</div>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Rumah Tangga</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Sampah Campur</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>Rp 30.000 <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>/ Bulan</span></h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Pengangkutan 2x Seminggu</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Tanpa Perlu Memilah</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Layanan Kebersihan</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20berlangganan%20paket%20Rumah%20Tangga%20(Sampah%20Campur)%20seharga%20Rp%2030.000/bulan." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Pilih Paket</a>
                  </div>
                </div>
              </div>
              {/* Pricing Item 3 */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="300ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 10px 40px 0px rgba(0,0,0,0.05)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 500ms ease' }}>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Rumah Tangga</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Campur & Pampers</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>Rp 35.000 <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>/ Bulan</span></h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Pengangkutan 2x Seminggu</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Bebas Limbah Pampers</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Layanan Kebersihan</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20berlangganan%20paket%20Rumah%20Tangga%20(Campur%20%26%20Pampers)%20seharga%20Rp%2035.000/bulan." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Pilih Paket</a>
                  </div>
                </div>
              </div>
              {/* Pricing Item 4 */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="400ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 10px 40px 0px rgba(0,0,0,0.05)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 500ms ease' }}>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Luar Desa</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Layanan Standar</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>Rp 35.000 <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>/ Bulan</span></h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Khusus Luar Desa Kemasan</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Pengangkutan Terjadwal</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Layanan Kebersihan</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20berlangganan%20paket%20Luar%20Desa%20(Layanan%20Standar)%20seharga%20Rp%2035.000/bulan." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Pilih Paket</a>
                  </div>
                </div>
              </div>
              {/* Pricing Item 5 */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="500ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 10px 40px 0px rgba(0,0,0,0.05)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 500ms ease' }}>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Warung / Toko</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Niaga Kecil</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '36px', fontWeight: 'bold', lineHeight: '1' }}>Rp 50.000 <span style={{ fontSize: '14px', color: '#999', fontWeight: 'normal' }}>/ Bulan</span></h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Volume Lebih Besar</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Prioritas Pengangkutan</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Cocok untuk Bisnis</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20berlangganan%20paket%20Warung%20/%20Toko%20(Niaga%20Kecil)%20seharga%20Rp%2050.000/bulan." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Pilih Paket</a>
                  </div>
                </div>
              </div>
              {/* Pricing Item 6 */}
              <div className="col-xl-4 col-lg-4 wow fadeInUp" data-wow-delay="600ms" style={{ marginBottom: '30px' }}>
                <div style={{ background: '#fff', padding: '30px 20px', borderRadius: '15px', boxShadow: '0px 10px 40px 0px rgba(0,0,0,0.05)', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 500ms ease' }}>
                  <div className="pricing-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--brote-base)', marginBottom: '10px' }}>Tarif Custom</h3>
                    <p style={{ color: '#777', fontSize: '14px', marginBottom: '15px' }}>Industri / Besar</p>
                    <h2 style={{ color: 'var(--brote-primary)', fontSize: '28px', fontWeight: 'bold', lineHeight: '1.2' }}>Hubungi Kami</h2>
                  </div>
                  <div className="pricing-body" style={{ flexGrow: 1 }}>
                    <ul className="list-unstyled" style={{ marginBottom: '20px' }}>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Volume Tak Terbatas</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Kontrak Fleksibel</li>
                      <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#666', fontSize: '14px' }}><span className="icon-tick" style={{ color: 'var(--brote-primary)', marginRight: '10px', fontSize: '14px' }}></span> Layanan Prioritas</li>
                    </ul>
                  </div>
                  <div className="pricing-footer" style={{ textAlign: 'center' }}>
                    <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20ingin%20konsultasi%20mengenai%20Laynan%20Tarif%20Custom%20(Industri%20/%20Besar)." target="_blank" rel="noopener noreferrer" className="thm-btn" style={{ width: '100%', padding: '12px 25px' }}>Hubungi Kami</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Pricing Section End */}

        {/* Process Start */}
        <section className="process" style={{ paddingTop: '120px' }}>
          <div className="container">
            <div className="section-title text-center">
              <span className="section-title__tagline">3 Langkah Mudah</span>
              <h2 className="section-title__title">Cara Kerja Layanan <br /> SABAMAS</h2>
            </div>
            <div className="process__inner">
              <div className="process-line">
                <img src="/assets/images/shapes/process-line.png" alt="" />
              </div>
              <div className="row">
                {/* Process Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="process__single">
                    <div className="process__icon-box">
                      <div className="process__icon">
                        {/* <span className="icon-find-my-friend"></span> */}
                        <img src="/assets/images/icon/icon-daftar.png" alt="Daftar" style={{ width: '60px', height: 'auto', position: 'relative', zIndex: 2 }} />
                        <div className="process-icon-shape"
                          style={{ backgroundImage: 'url(/assets/images/shapes/process-icon-shape.png)' }}>
                        </div>
                      </div>
                      <div className="process__count"></div>
                    </div>
                    <div className="process__content">
                      <h3 className="process__title"><a href="#">Daftar & <br /> Langganan</a></h3>
                      <p className="process__text">Registrasi akun dan pilih paket layanan yang sesuai kebutuhan Anda.</p>
                    </div>
                  </div>
                </div>
                {/* Process Single End */}
                {/* Process Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="process__single process__single-two">
                    <div className="process__icon-box">
                      <div className="process__icon">
                        {/* <span className="icon-choose"></span> */}
                        <img src="/assets/images/icon/icon-petugas.png" alt="Petugas" style={{ width: '60px', height: 'auto', position: 'relative', zIndex: 2 }} />
                        <div className="process-icon-shape"
                          style={{ backgroundImage: 'url(/assets/images/shapes/process-icon-shape.png)' }}>
                        </div>
                      </div>
                      <div className="process__count"></div>
                    </div>
                    <div className="process__content">
                      <h3 className="process__title"><a href="#">Petugas <br /> Menjemput</a></h3>
                      <p className="process__text">Tim kami akan datang mengambil sampah sesuai jadwal yang ditentukan.</p>
                    </div>
                  </div>
                </div>
                {/* Process Single End */}
                {/* Process Single Start */}
                <div className="col-xl-4 col-lg-4">
                  <div className="process__single">
                    <div className="process__icon-box">
                      <div className="process__icon">
                        <span className="icon-tick-mark"></span>
                        <div className="process-icon-shape"
                          style={{ backgroundImage: 'url(/assets/images/shapes/process-icon-shape.png)' }}>
                        </div>
                      </div>
                      <div className="process__count"></div>
                    </div>
                    <div className="process__content">
                      <h3 className="process__title"><a href="#">Bersih & <br /> Terkelola</a></h3>
                      <p className="process__text">Sampah dikelola secara profesional dan lingkungan Anda tetap bersih.</p>
                    </div>
                  </div>
                </div>
                {/* Process Single End */}
              </div>
            </div>
          </div>
        </section>
        {/* Process End */}

        {/* Call One Start */}
        <section className="call-one" style={{ marginBottom: '25px', position: 'relative', zIndex: 2 }}>
          <div className="call-one-shape-1" style={{ backgroundImage: 'url(/assets/images/shapes/call-one-shape-1.png)' }}>
          </div>
          <div className="call-one-shape-2" style={{ backgroundImage: 'url(/assets/images/shapes/call-one-shape-2.png)' }}>
          </div>
          <div className="container">
            <div className="call-one__inner">
              <div className="call-one__text-box">
                <p className="call-one__text">Butuh Layanan Khusus? Hubungi Kami Sekarang!</p>
              </div>
              <div className="call-one__call-number">
                <a href="https://wa.me/6285867714590?text=Halo%20SABAMAS,%20saya%20butuh%20informasi%20layanan%20khusus." target="_blank" rel="noopener noreferrer"> <i className="fab fa-whatsapp"></i> +62 858 6771 4590</a>
              </div>
            </div>
          </div>
        </section>
        {/* Call One End */}

        {/* Site Footer Start */}
        <footer className="site-footer">
          <div className="site-footer-shape-1"
            style={{ backgroundImage: 'url(/assets/images/shapes/site-footer-shape-1.png)' }}>
          </div>
          <div className="site-footer-shape-two">
            <img src="/assets/images/shapes/site-footer-shape-2.png" alt="" />
          </div>
          <div className="site-footer__top">
            <div className="container">
              <div className="row">
                <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="100ms">
                  <div className="footer-widget__column footer-widget__about">
                    <h3 className="footer-widget__title">SABAMAS</h3>
                    <div className="footer-widget__about-text-box">
                      <p className="footer-widget__about-text">Solusi pengelolaan sampah digital untuk masa depan yang lebih hijau. Bersama kita jaga bumi.</p>
                    </div>
                    <div className="site-footer__social">
                      <a href="#"><i className="fab fa-twitter"></i></a>
                      <a href="#"><i className="fab fa-facebook"></i></a>
                      <a href="#"><i className="fab fa-pinterest-p"></i></a>
                      <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                  </div>
                </div>
                <div className="col-xl-2 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="200ms">
                  <div className="footer-widget__column footer-widget__links clearfix">
                    <h3 className="footer-widget__title">Tautan</h3>
                    <ul className="footer-widget__links-list list-unstyled clearfix">
                      <li><a href="#home">Beranda</a></li>
                      <li><a href="#about">Tentang Kami</a></li>
                      <li><a href="#services">Layanan</a></li>
                      <li><a href="#portfolio">Galeri</a></li>
                      <li><a href="#pricing">Tarif</a></li>
                    </ul>
                  </div>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="300ms">
                  {/* Recent posts or Contact Info */}
                  <div className="footer-widget__column">
                    <h3 className="footer-widget__title">Kontak</h3>
                    <p style={{ color: '#a5a4a4', fontSize: '15px' }}>Kemasan, Sawit, Boyolali, Jawa Tengah</p>
                    <p style={{ color: '#a5a4a4', fontSize: '15px' }}><a href="https://wa.me/6285867714590" target="_blank" rel="noopener noreferrer" style={{ color: '#a5a4a4' }}>+62 858 6771 4590</a></p>
                    <p style={{ color: '#a5a4a4', fontSize: '15px' }}><a href="mailto:sabamaskemasan@gmail.com" style={{ color: '#a5a4a4' }}>sabamaskemasan@gmail.com</a></p>
                  </div>
                </div>
                <div className="col-xl-4 col-lg-6 col-md-6 wow fadeInUp" data-wow-delay="400ms">
                  <div className="footer-widget__column footer-widget__newsletter">
                    <h3 className="footer-widget__title">Login Admin</h3>
                    <p className="footer-widget__newsletter-text">Masuk ke dashboard admin.</p>
                    <div className="footer-widget__newsletter-form">
                      {/* Simple Link to Admin Login */}
                      <a href="/login" className="thm-btn" style={{ padding: '10px 30px' }}>Masuk Admin</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="site-footer__bottom">
            <div className="container">
              <div className="row">
                <div className="col-xl-12">
                  <div className="site-footer__bottom-inner">
                    <p className="site-footer__bottom-text">© Copyright 2025 by <a href="#">SABAMAS</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
        {/* Site Footer End */}

      </div >
      {/* /.page-wrapper */}

      < div className="mobile-nav__wrapper" >
        <div className="mobile-nav__overlay mobile-nav__toggler"></div>
        <div className="mobile-nav__content">
          <span className="mobile-nav__close mobile-nav__toggler"><i className="fa fa-times"></i></span>
          <div className="logo-box">
            <a href="index.html" aria-label="logo image">
              <h2 style={{ color: 'white' }}>SABAMAS</h2>
            </a>
          </div>
          <div className="mobile-nav__container"></div>
          <div className="mobile-nav__buttons" style={{
            marginTop: '30px',
            marginBottom: '30px',
            padding: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            width: '100%'
          }}>
            <a href="/portal-login" className="thm-btn" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              padding: '15px 20px',
              textAlign: 'center',
              color: '#ffffff',
              backgroundColor: '#6240ed',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              Cek Tagihan
            </a>
            <a href="/login" className="thm-btn" style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              padding: '15px 20px',
              textAlign: 'center',
              color: '#ffffff',
              backgroundColor: '#1f1f1f',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              border: 'none',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              Login Admin
            </a>
          </div>
          <ul className="mobile-nav__contact list-unstyled">
            <li>
              <i className="fa fa-envelope"></i>
              <a href="mailto:sabamaskemasan@gmail.com">sabamaskemasan@gmail.com</a>
            </li>
            <li>
              <i className="fa fa-phone-alt"></i>
              <a href="tel:+6281234567890">+62 812 3456 7890</a>
            </li>
          </ul>
          <div className="mobile-nav__top">
            <div className="mobile-nav__social">
              <a href="#" className="fab fa-twitter"></a>
              <a href="#" className="fab fa-facebook-square"></a>
              <a href="#" className="fab fa-pinterest-p"></a>
              <a href="#" className="fab fa-instagram"></a>
            </div>
          </div>
        </div>
      </div >

      <div className="search-popup">
        <div className="search-popup__overlay search-toggler"></div>
        <div className="search-popup__content">
          <form action="#">
            <label htmlFor="search" className="sr-only">search here</label>
            <input type="text" id="search" placeholder="Search Here..." />
            <button type="submit" aria-label="search submit" className="thm-btn">
              <i className="fa fa-search"></i>
            </button>
          </form>
        </div>
      </div>

      <a href="#" data-target="html" className="scroll-to-target scroll-to-top"><i className="fa fa-angle-up"></i></a>
      <div className="custom-cursor__cursor"></div>
      <div className="custom-cursor__cursor-two"></div>
    </>
  )
}
