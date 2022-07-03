import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'
require('intersection-observer')

const ImageComponent = styled.img`
  width: ${({ size }) => size || '100%'};
  height: ${({ size }) => size || '100%'};
  min-width: ${({ size }) => size};
  min-height: ${({ size }) => size};
  max-width: ${({ size }) => size};
  max-height: ${({ size }) => size};

  transition: all 1s ease-in-out;

  @keyframes placeHolder {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }

  ${props => props.imageLoaded
    || props.noPlaceholder
    || `
    animation-name: placeHolder;
    animation-duration: 1.5s;
    animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    background: #f6f7f8;
    background: linear-gradient(to right, #eeeeee 8%, #dfdfdf 20%, #eeeeee 33%);
    background-size: 800px 104px;
    filter: blur(5px);
    position: relative;
  `}
`

function LazyImage({ src, ...props }) {
  const imageRef = useRef()
  const [imageLoaded, setImageLoaded] = useState(false)
  let observer

  useEffect(() => {
    observer = new IntersectionObserver(startLoading)
    if (!imageLoaded) {
      observer.observe(imageRef.current)
    }
    return () => observer.unobserve(imageRef.current)
  }, [])

  function startLoading(entries, object) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      if (entry.intersectionRatio > 0) {
        observer.unobserve(entry.target)
      }

      if (!imageLoaded) {
        const downloadingImage = new Image()
        downloadingImage.onload = () => {
          if (imageRef.current) {
            imageRef.current.setAttribute('src', downloadingImage.src)
            setImageLoaded(true)
          }
        }
        downloadingImage.src = src
        object.unobserve(entry.target)
      }

      object.unobserve(entry.target)
    })
  }

  return (
    <ImageComponent
      {...props}
      alt=""
      ref={imageRef}
      imageLoaded={imageLoaded}
    />
  )
}

LazyImage.propTypes = {
  src: PropTypes.string.isRequired,
  size: PropTypes.string,
  noPlaceholder: PropTypes.bool,
}

LazyImage.defaultProps = {
  size: null,
  noPlaceholder: false,
}

export default LazyImage
